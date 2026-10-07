import { describe, expect, it } from "vitest";

import { buildPomodoroSequence } from "./pomodoroSequence";
import {
  completeTimer,
  createTimerState,
  pauseTimer,
  startTimer,
  tickTimer,
  validateTimerState,
} from "./pomodoroTimer";
import type {
  PomodoroSettingsProfile,
  PomodoroTimerState,
} from "../types";

const T0 = 1_730_000_000_000;
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

const baseSettings: PomodoroSettingsProfile = {
  id: "test",
  name: "Test",

  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,

  sessionLength: 4,
  autoStartNextTimer: false,

  longBreakAfterSession: 4,
};

function withSettings(
  overrides: Partial<PomodoroSettingsProfile>,
): PomodoroSettingsProfile {
  return { ...baseSettings, ...overrides };
}

function finishedTimerAt(
  settings: PomodoroSettingsProfile,
  index: number,
): PomodoroTimerState {
  const sequence = buildPomodoroSequence(settings);
  const running = startTimer(createTimerState(sequence[index], settings), T0);

  return tickTimer(running, T0 + HOUR);
}

describe("completeTimer", () => {
  it("leaves every status except finished untouched", () => {
    const settings = withSettings({ autoStartNextTimer: true });
    const sequence = buildPomodoroSequence(settings);

    const idle = createTimerState(sequence[0], settings);
    const running = startTimer(idle, T0);
    const paused = pauseTimer(running, T0 + SECOND);

    for (const state of [idle, running, paused]) {
      expect(completeTimer(state, sequence, settings, T0 + HOUR)).toBe(state);
    }
  });

  it("auto-start OFF: loads the next timer and waits for a manual start", () => {
    const settings = withSettings({ autoStartNextTimer: false });
    const sequence = buildPomodoroSequence(settings);

    const next = completeTimer(
      finishedTimerAt(settings, 0),
      sequence,
      settings,
      T0 + HOUR,
    );

    expect(next.status).toBe("idle");
    expect(next.currentTimerType).toBe("shortBreak");
    expect(next.currentSequenceIndex).toBe(1);
    expect(next.remainingSeconds).toBe(5 * 60);
    expect(next.endTime).toBeNull();
    expect(validateTimerState(next)).toEqual([]);

    // Time passing changes nothing until the user presses Start.
    expect(tickTimer(next, T0 + 5 * HOUR)).toBe(next);
  });

  it("auto-start ON: starts the next timer from now", () => {
    const settings = withSettings({ autoStartNextTimer: true });
    const sequence = buildPomodoroSequence(settings);
    const now = T0 + HOUR;

    const next = completeTimer(
      finishedTimerAt(settings, 0),
      sequence,
      settings,
      now,
    );

    expect(next.status).toBe("running");
    expect(next.currentTimerType).toBe("shortBreak");
    expect(next.remainingSeconds).toBe(5 * 60);
    expect(next.startedAt).toBe(now);
    expect(next.endTime).toBe(now + 5 * MINUTE);
    expect(validateTimerState(next)).toEqual([]);
  });

  it("auto-start ON: does not carry across the end of the cycle", () => {
    const settings = withSettings({ autoStartNextTimer: true });
    const sequence = buildPomodoroSequence(settings);
    const lastIndex = sequence.length - 1;

    const next = completeTimer(
      finishedTimerAt(settings, lastIndex),
      sequence,
      settings,
      T0 + HOUR,
    );

    expect(next.status).toBe("idle");
    expect(next.currentSequenceIndex).toBe(0);
    expect(next.currentTimerType).toBe("focus");
  });

  it("auto-start OFF: wraps to the first item at the end of the cycle", () => {
    const settings = withSettings({ autoStartNextTimer: false });
    const sequence = buildPomodoroSequence(settings);

    const next = completeTimer(
      finishedTimerAt(settings, sequence.length - 1),
      sequence,
      settings,
      T0 + HOUR,
    );

    expect(next.status).toBe("idle");
    expect(next.currentSequenceIndex).toBe(0);
  });

  it("does not loop forever when the cycle has a single item", () => {
    const settings = withSettings({
      sessionLength: 1,
      shortBreakMinutes: 0,
      longBreakMinutes: 0,
      longBreakAfterSession: null,
      autoStartNextTimer: true,
    });
    const sequence = buildPomodoroSequence(settings);

    expect(sequence).toHaveLength(1);

    const next = completeTimer(
      finishedTimerAt(settings, 0),
      sequence,
      settings,
      T0 + HOUR,
    );

    expect(next.status).toBe("idle");
  });

  it("is safe to call again: the second call changes nothing", () => {
    const settings = withSettings({ autoStartNextTimer: true });
    const sequence = buildPomodoroSequence(settings);

    const once = completeTimer(
      finishedTimerAt(settings, 0),
      sequence,
      settings,
      T0 + HOUR,
    );
    const twice = completeTimer(once, sequence, settings, T0 + HOUR);

    expect(twice).toBe(once);
  });
});

describe("a whole cycle driven by the clock", () => {
  function runCycle(settings: PomodoroSettingsProfile) {
    const sequence = buildPomodoroSequence(settings);

    let state = startTimer(createTimerState(sequence[0], settings), T0);
    const finishedTypes: string[] = [];
    let endedAt: number | null = null;

    for (let elapsed = 0; elapsed <= 3 * HOUR; elapsed += SECOND) {
      const now = T0 + elapsed;
      const ticked = tickTimer(state, now);

      if (ticked.status === "finished") {
        finishedTypes.push(ticked.currentTimerType);
        state = completeTimer(ticked, sequence, settings, now);

        if (state.status !== "running") {
          endedAt = now;
          break;
        }
      } else {
        state = ticked;
      }

      expect(validateTimerState(state)).toEqual([]);
    }

    return { state, finishedTypes, endedAt };
  }

  it("auto-start ON runs all 8 timers back to back with no drift", () => {
    const { state, finishedTypes, endedAt } = runCycle(
      withSettings({ autoStartNextTimer: true }),
    );

    expect(finishedTypes).toEqual([
      "focus", "shortBreak", "focus", "shortBreak",
      "focus", "shortBreak", "focus", "longBreak",
    ]);

    // 4 x 25 + 3 x 5 + 15 = 130 minutes, to the second.
    expect(endedAt).toBe(T0 + 130 * MINUTE);

    expect(state.status).toBe("idle");
    expect(state.currentSequenceIndex).toBe(0);
  });

  it("auto-start OFF stops after the first timer and waits", () => {
    const { state, finishedTypes, endedAt } = runCycle(
      withSettings({ autoStartNextTimer: false }),
    );

    expect(finishedTypes).toEqual(["focus"]);
    expect(endedAt).toBe(T0 + 25 * MINUTE);
    expect(state.status).toBe("idle");
    expect(state.currentTimerType).toBe("shortBreak");
  });
});
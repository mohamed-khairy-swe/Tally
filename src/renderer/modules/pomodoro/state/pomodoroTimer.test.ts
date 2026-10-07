import { describe, expect, it } from "vitest";

import { buildPomodoroSequence } from "./pomodoroSequence";
import {
  createTimerState,
  formatRemainingTime,
  pauseTimer,
  restartTimer,
  resumeTimer,
  startTimer,
  tickTimer,
  toggleTimer,
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

function makeFocusTimer(focusMinutes: number): PomodoroTimerState {
  const settings = { ...baseSettings, focusMinutes };
  const [firstItem] = buildPomodoroSequence(settings);

  return createTimerState(firstItem, settings);
}

function expectValid(state: PomodoroTimerState): void {
  expect(validateTimerState(state)).toEqual([]);
}

describe("createTimerState", () => {
  it("takes the duration from the settings for each timer type", () => {
    const sequence = buildPomodoroSequence(baseSettings);

    const focus = createTimerState(sequence[0], baseSettings);
    const short = createTimerState(sequence[1], baseSettings);
    const long = createTimerState(sequence[7], baseSettings);

    expect(focus.durationSeconds).toBe(25 * 60);
    expect(short.durationSeconds).toBe(5 * 60);
    expect(long.durationSeconds).toBe(15 * 60);

    expect(long.currentTimerType).toBe("longBreak");
    expect(long.currentSequenceIndex).toBe(7);
    expect(focus.status).toBe("idle");
    expectValid(focus);
  });
});

describe.each([1, 2, 5, 25, 59, 60, 61, 120])(
  "%i-minute focus timer",
  (minutes) => {
    const durationMs = minutes * MINUTE;

    it("starts with the full duration", () => {
      const started = startTimer(makeFocusTimer(minutes), T0);

      expect(started.status).toBe("running");
      expect(started.remainingSeconds).toBe(minutes * 60);
      expect(started.endTime).toBe(T0 + durationMs);
      expect(formatRemainingTime(started.remainingSeconds)).toBe(
        `${String(minutes).padStart(2, "0")}:00`,
      );
      expectValid(started);
    });

    it("is still running one millisecond before the deadline", () => {
      const started = startTimer(makeFocusTimer(minutes), T0);
      const almost = tickTimer(started, T0 + durationMs - 1);

      expect(almost.status).toBe("running");
      expect(almost.remainingSeconds).toBeGreaterThan(0);
      expect(formatRemainingTime(almost.remainingSeconds)).toBe("00:01");
      expectValid(almost);
    });

    it("finishes exactly at the deadline", () => {
      const started = startTimer(makeFocusTimer(minutes), T0);
      const finished = tickTimer(started, T0 + durationMs);

      expect(finished.status).toBe("finished");
      expect(finished.remainingSeconds).toBe(0);
      expect(finished.endTime).toBeNull();
      expectValid(finished);
    });

    it("never goes negative when checked long after the deadline", () => {
      const started = startTimer(makeFocusTimer(minutes), T0);
      const finished = tickTimer(started, T0 + durationMs + 3 * HOUR);

      expect(finished.status).toBe("finished");
      expect(finished.remainingSeconds).toBe(0);
      expect(formatRemainingTime(finished.remainingSeconds)).toBe("00:00");
      expectValid(finished);
    });

    it("completes exactly once, even if ticked many more times", () => {
      let state = startTimer(makeFocusTimer(minutes), T0);
      let completions = 0;

      for (let elapsed = 0; elapsed <= durationMs + 10 * SECOND; elapsed += SECOND) {
        const next = tickTimer(state, T0 + elapsed);

        if (state.status !== "finished" && next.status === "finished") {
          completions += 1;
        }

        expectValid(next);
        state = next;
      }

      expect(completions).toBe(1);
      expect(state.status).toBe("finished");
      expect(tickTimer(state, T0 + 10 * HOUR)).toBe(state);
    });
  },
);

describe("pause and resume", () => {
  it("freezes the remaining time while paused", () => {
    const started = startTimer(makeFocusTimer(25), T0);
    const paused = pauseTimer(started, T0 + 10 * SECOND);

    expect(paused.status).toBe("paused");
    expect(paused.remainingSeconds).toBe(25 * 60 - 10);
    expect(paused.endTime).toBeNull();
    expectValid(paused);

    // An hour passes while paused: nothing changes.
    expect(tickTimer(paused, T0 + HOUR)).toBe(paused);
  });

  it("continues from where it stopped after resuming", () => {
    const started = startTimer(makeFocusTimer(25), T0);
    const paused = pauseTimer(started, T0 + 10 * SECOND);
    const resumed = resumeTimer(paused, T0 + HOUR);

    expect(resumed.status).toBe("running");
    expect(resumed.endTime).toBe(T0 + HOUR + (25 * 60 - 10) * SECOND);
    expectValid(resumed);

    const later = tickTimer(resumed, T0 + HOUR + 5 * SECOND);
    expect(later.remainingSeconds).toBe(25 * 60 - 15);
  });

  it("does not gain or lose time on repeated pause/resume", () => {
    let state = startTimer(makeFocusTimer(25), T0);

    state = pauseTimer(state, T0 + 10_500);
    const remainingAfterFirstPause = state.remainingSeconds;
    expect(remainingAfterFirstPause).toBeCloseTo(25 * 60 - 10.5, 6);

    for (let i = 0; i < 20; i++) {
      state = resumeTimer(state, T0 + HOUR + i * SECOND);
      state = pauseTimer(state, T0 + HOUR + i * SECOND);
    }

    expect(state.remainingSeconds).toBeCloseTo(remainingAfterFirstPause, 6);
    expectValid(state);
  });

  it("finishes instead of pausing if the deadline already passed", () => {
    const started = startTimer(makeFocusTimer(1), T0);
    const result = pauseTimer(started, T0 + 5 * MINUTE);

    expect(result.status).toBe("finished");
    expect(result.remainingSeconds).toBe(0);
    expectValid(result);
  });

  it("ignores invalid transitions", () => {
    const idle = makeFocusTimer(25);
    const started = startTimer(idle, T0);
    const paused = pauseTimer(started, T0 + SECOND);

    expect(pauseTimer(idle, T0)).toBe(idle);
    expect(resumeTimer(idle, T0)).toBe(idle);
    expect(resumeTimer(started, T0)).toBe(started);
    expect(startTimer(started, T0 + SECOND)).toBe(started);
    expect(startTimer(paused, T0 + SECOND)).toBe(paused);
  });
});

describe("restartTimer", () => {
  it("returns to idle with the full duration from any status", () => {
    const idle = makeFocusTimer(25);
    const running = tickTimer(startTimer(idle, T0), T0 + 30 * SECOND);
    const paused = pauseTimer(running, T0 + 30 * SECOND);
    const finished = tickTimer(startTimer(idle, T0), T0 + HOUR);

    for (const state of [idle, running, paused, finished]) {
      const restarted = restartTimer(state);

      expect(restarted.status).toBe("idle");
      expect(restarted.remainingSeconds).toBe(25 * 60);
      expect(restarted.startedAt).toBeNull();
      expect(restarted.endTime).toBeNull();
      expectValid(restarted);
    }
  });
});

describe("toggleTimer", () => {
  it("starts, pauses and resumes, and does nothing when finished", () => {
    const idle = makeFocusTimer(25);

    const running = toggleTimer(idle, T0);
    expect(running.status).toBe("running");

    const paused = toggleTimer(running, T0 + SECOND);
    expect(paused.status).toBe("paused");

    const resumed = toggleTimer(paused, T0 + 2 * SECOND);
    expect(resumed.status).toBe("running");

    const finished = tickTimer(resumed, T0 + 3 * HOUR);
    expect(toggleTimer(finished, T0 + 3 * HOUR)).toBe(finished);
  });
});

describe("system clock and sleep edge cases", () => {
  it("finishes if the computer slept past the deadline", () => {
    const started = startTimer(makeFocusTimer(25), T0);
    const afterSleep = tickTimer(started, T0 + 8 * HOUR);

    expect(afterSleep.status).toBe("finished");
    expect(afterSleep.remainingSeconds).toBe(0);
  });

  it("never reports more than the full duration if the clock jumps back", () => {
    const started = startTimer(makeFocusTimer(25), T0);
    const jumpedBack = tickTimer(started, T0 - 10 * MINUTE);

    expect(jumpedBack.remainingSeconds).toBe(25 * 60);
    expectValid(jumpedBack);
  });

  it("does nothing when ticking an idle timer", () => {
    const idle = makeFocusTimer(25);

    expect(tickTimer(idle, T0 + HOUR)).toBe(idle);
  });
});

describe("formatRemainingTime", () => {
  it("formats minutes and seconds without capping minutes at 59", () => {
    expect(formatRemainingTime(0)).toBe("00:00");
    expect(formatRemainingTime(59)).toBe("00:59");
    expect(formatRemainingTime(25 * 60)).toBe("25:00");
    expect(formatRemainingTime(59 * 60 + 59)).toBe("59:59");
    expect(formatRemainingTime(60 * 60)).toBe("60:00");
    expect(formatRemainingTime(61 * 60)).toBe("61:00");
    expect(formatRemainingTime(120 * 60)).toBe("120:00");
  });

  it("rounds partial seconds up and clamps negatives to zero", () => {
    expect(formatRemainingTime(0.2)).toBe("00:01");
    expect(formatRemainingTime(1499.1)).toBe("25:00");
    expect(formatRemainingTime(-5)).toBe("00:00");
  });
});
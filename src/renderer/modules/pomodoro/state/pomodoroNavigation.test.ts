import { describe, expect, it } from "vitest";

import { buildPomodoroSequence } from "./pomodoroSequence";
import {
  createTimerState,
  moveToNextTimer,
  moveToPreviousTimer,
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
const HOUR = 60 * 60 * SECOND;

const settings: PomodoroSettingsProfile = {
  id: "test",
  name: "Test",

  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,

  sessionLength: 4,
  autoStartNextTimer: false,

  longBreakAfterSession: 4,
};

// F1 S1 F2 S2 F3 S3 F4 L4  (indexes 0 to 7)
const sequence = buildPomodoroSequence(settings);

function timerAt(index: number): PomodoroTimerState {
  return createTimerState(sequence[index], settings);
}

describe("moveToNextTimer / moveToPreviousTimer", () => {
  it("moves to the neighbouring item with the right type and duration", () => {
    const next = moveToNextTimer(timerAt(0), sequence, settings);

    expect(next.currentSequenceIndex).toBe(1);
    expect(next.currentTimerType).toBe("shortBreak");
    expect(next.durationSeconds).toBe(5 * 60);
    expect(next.remainingSeconds).toBe(5 * 60);

    const previous = moveToPreviousTimer(timerAt(7), sequence, settings);

    expect(previous.currentSequenceIndex).toBe(6);
    expect(previous.currentTimerType).toBe("focus");
    expect(previous.durationSeconds).toBe(25 * 60);
  });

  it("reaches the long break", () => {
    const long = moveToNextTimer(timerAt(6), sequence, settings);

    expect(long.currentTimerType).toBe("longBreak");
    expect(long.durationSeconds).toBe(15 * 60);
  });

  it("wraps around in both directions", () => {
    expect(moveToNextTimer(timerAt(7), sequence, settings).currentSequenceIndex).toBe(0);
    expect(moveToPreviousTimer(timerAt(0), sequence, settings).currentSequenceIndex).toBe(7);
  });

  it("lands on a stopped, full-length timer from every status", () => {
    const idle = timerAt(2);
    const running = tickTimer(startTimer(idle, T0), T0 + 90 * SECOND);
    const paused = pauseTimer(running, T0 + 90 * SECOND);
    const finished = tickTimer(startTimer(idle, T0), T0 + HOUR);

    for (const state of [idle, running, paused, finished]) {
      for (const move of [moveToNextTimer, moveToPreviousTimer]) {
        const moved = move(state, sequence, settings);

        expect(moved.status).toBe("idle");
        expect(moved.remainingSeconds).toBe(moved.durationSeconds);
        expect(moved.startedAt).toBeNull();
        expect(moved.endTime).toBeNull();
        expect(validateTimerState(moved)).toEqual([]);
      }
    }
  });

  it("never turns a skipped timer into a finished one", () => {
    const running = startTimer(timerAt(0), T0);
    const moved = moveToNextTimer(running, sequence, settings);

    // Even much later, the old deadline is gone: nothing can finish.
    expect(tickTimer(moved, T0 + HOUR)).toBe(moved);
    expect(moved.status).not.toBe("finished");
  });

  it("walks the whole cycle forward and back to the start", () => {
    let state = timerAt(0);
    const visited: string[] = [];

    for (let step = 0; step < sequence.length; step++) {
      visited.push(state.currentTimerType);
      state = moveToNextTimer(state, sequence, settings);
    }

    expect(state.currentSequenceIndex).toBe(0);
    expect(visited).toEqual([
      "focus", "shortBreak", "focus", "shortBreak",
      "focus", "shortBreak", "focus", "longBreak",
    ]);
  });

  it("leaves the state alone when the sequence is empty", () => {
    const state = timerAt(0);

    expect(moveToNextTimer(state, [], settings)).toBe(state);
    expect(moveToPreviousTimer(state, [], settings)).toBe(state);
  });
});
import {
  getNextSequenceIndex,
  getPreviousSequenceIndex,
} from "./pomodoroSequence";

import type {
  PomodoroSequenceItem,
  PomodoroSettingsProfile,
  PomodoroTimerState,
  PomodoroTimerType,
} from "../types";

export const INITIAL_POMODORO_TIMER_STATE: PomodoroTimerState = {
  status: "idle",

  currentSequenceIndex: 0,
  currentTimerType: "focus",

  durationSeconds: 0,
  remainingSeconds: 0,

  startedAt: null,
  endTime: null,
};

export function validateTimerState(state: PomodoroTimerState): string[] {
  const errors: string[] = [];

  if (state.currentSequenceIndex < 0) {
    errors.push("Current sequence index cannot be negative.");
  }

  if (state.durationSeconds < 0) {
    errors.push("Timer duration cannot be negative.");
  }

  if (state.remainingSeconds < 0) {
    errors.push("Remaining time cannot be negative.");
  }

  if (state.remainingSeconds > state.durationSeconds) {
    errors.push("Remaining time cannot exceed timer duration.");
  }

  if (state.status === "finished" && state.remainingSeconds !== 0) {
    errors.push("A finished timer must have zero remaining time.");
  }

  if (state.status === "running" && state.endTime === null) {
    errors.push("A running timer must have an end time.");
  }

  if (state.status === "paused" && state.endTime !== null) {
    errors.push("A paused timer cannot have an active end time.");
  }

  return errors;
}

export function getDurationSeconds(
  settings: PomodoroSettingsProfile,
  type: PomodoroTimerType,
): number {
  switch (type) {
    case "focus":
      return settings.focusMinutes * 60;

    case "shortBreak":
      return settings.shortBreakMinutes * 60;

    case "longBreak":
      return settings.longBreakMinutes * 60;
  }
}

/** Creates an idle timer, ready to start, for one item of the sequence. */
export function createTimerState(
  item: PomodoroSequenceItem,
  settings: PomodoroSettingsProfile,
): PomodoroTimerState {
  const durationSeconds = getDurationSeconds(settings, item.type);

  return {
    status: "idle",

    currentSequenceIndex: item.index,
    currentTimerType: item.type,

    durationSeconds,
    remainingSeconds: durationSeconds,

    startedAt: null,
    endTime: null,
  };
}

/**
 * Brings a running timer up to date with the clock.
 *
 * The clock (`endTime - now`) is the only source of truth. It does not
 * matter how often or how late this is called: once the deadline has
 * passed the timer becomes "finished" with exactly 0 remaining, and every
 * later call returns the very same state object (so completion happens
 * exactly once).
 */
export function tickTimer(
  state: PomodoroTimerState,
  now: number,
): PomodoroTimerState {
  if (state.status !== "running" || state.endTime === null) {
    return state;
  }

  const millisecondsLeft = state.endTime - now;

  if (millisecondsLeft <= 0) {
    return {
      ...state,
      status: "finished",
      remainingSeconds: 0,
      endTime: null,
    };
  }

  return {
    ...state,
    remainingSeconds: Math.min(
      millisecondsLeft / 1000,
      state.durationSeconds,
    ),
  };
}

/** idle -> running. Ignored in every other status. */
export function startTimer(
  state: PomodoroTimerState,
  now: number,
): PomodoroTimerState {
  if (state.status !== "idle") {
    return state;
  }

  return {
    ...state,
    status: "running",
    remainingSeconds: state.durationSeconds,
    startedAt: now,
    endTime: now + state.durationSeconds * 1000,
  };
}

/** running -> paused. If the deadline already passed, it finishes instead. */
export function pauseTimer(
  state: PomodoroTimerState,
  now: number,
): PomodoroTimerState {
  if (state.status !== "running") {
    return state;
  }

  const current = tickTimer(state, now);

  if (current.status !== "running") {
    return current;
  }

  return {
    ...current,
    status: "paused",
    endTime: null,
  };
}

/** paused -> running, continuing from the exact remaining time. */
export function resumeTimer(
  state: PomodoroTimerState,
  now: number,
): PomodoroTimerState {
  if (state.status !== "paused") {
    return state;
  }

  return {
    ...state,
    status: "running",
    endTime: now + Math.round(state.remainingSeconds * 1000),
  };
}

/** Any status -> idle with the full duration of the current timer. */
export function restartTimer(
  state: PomodoroTimerState,
): PomodoroTimerState {
  return {
    ...state,
    status: "idle",
    remainingSeconds: state.durationSeconds,
    startedAt: null,
    endTime: null,
  };
}

/** What the single Start / Pause button does in each status. */
export function toggleTimer(
  state: PomodoroTimerState,
  now: number,
): PomodoroTimerState {
  switch (state.status) {
    case "idle":
      return startTimer(state, now);

    case "running":
      return pauseTimer(state, now);

    case "paused":
      return resumeTimer(state, now);

    case "finished":
      return state;
  }
}

/** Formats seconds as MM:SS, rounding up. Minutes are not capped at 59. */
export function formatRemainingTime(remainingSeconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingSeconds));

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Moves to the next item of the sequence (wrapping from the last item back
 * to the first). Whatever the current status was, the result is a fresh,
 * idle timer at the full duration of the new item. The old timer is
 * discarded, never "finished", so skipping can never count as a completion.
 */
export function moveToNextTimer(
  state: PomodoroTimerState,
  sequence: readonly PomodoroSequenceItem[],
  settings: PomodoroSettingsProfile,
): PomodoroTimerState {
  if (sequence.length === 0) {
    return state;
  }

  const nextIndex = getNextSequenceIndex(
    state.currentSequenceIndex,
    sequence.length,
  );

  return createTimerState(sequence[nextIndex], settings);
}

/** Same as moveToNextTimer, but backwards (wrapping from first to last). */
export function moveToPreviousTimer(
  state: PomodoroTimerState,
  sequence: readonly PomodoroSequenceItem[],
  settings: PomodoroSettingsProfile,
): PomodoroTimerState {
  if (sequence.length === 0) {
    return state;
  }

  const previousIndex = getPreviousSequenceIndex(
    state.currentSequenceIndex,
    sequence.length,
  );

  return createTimerState(sequence[previousIndex], settings);
}


/**
 * The explicit transition out of "finished": loads the next timer of the
 * sequence.
 *
 * - Auto-start OFF: the next timer is ready but idle, so the user has to
 *   start it manually.
 * - Auto-start ON: the next timer starts right away, counted from `now`
 *   (not from the old deadline, so it is correct even if the computer
 *   slept past it).
 * - Auto-start never carries across the end of a cycle. After the last
 *   item the sequence wraps to the first item and waits.
 *
 * Any status other than "finished" is returned untouched, so calling this
 * more than once can never skip ahead twice.
 */
export function completeTimer(
  state: PomodoroTimerState,
  sequence: readonly PomodoroSequenceItem[],
  settings: PomodoroSettingsProfile,
  now: number,
): PomodoroTimerState {
  if (state.status !== "finished") {
    return state;
  }

  const next = moveToNextTimer(state, sequence, settings);

  const isLastItemOfCycle =
    state.currentSequenceIndex === sequence.length - 1;

  if (settings.autoStartNextTimer && !isLastItemOfCycle) {
    return startTimer(next, now);
  }

  return next;
}
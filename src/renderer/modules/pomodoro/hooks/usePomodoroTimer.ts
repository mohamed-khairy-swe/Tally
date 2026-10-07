import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { buildPomodoroSequence } from "../state/pomodoroSequence";
import {
  completeTimer,
  createTimerState,
  moveToNextTimer,
  moveToPreviousTimer,
  restartTimer,
  tickTimer,
  toggleTimer,
} from "../state/pomodoroTimer";
import type {
  PomodoroSequenceItem,
  PomodoroSettingsProfile,
  PomodoroTimerState,
} from "../types";

const TICK_INTERVAL_MS = 250;

/**
 * Only the settings that change the shape or length of the timer belong
 * here. Changing any of them applies the new settings and resets the timer.
 * (`autoStartNextTimer` is deliberately not part of the key.)
 */
function getTimerConfigKey(settings: PomodoroSettingsProfile): string {
  return [
    settings.id,
    settings.focusMinutes,
    settings.shortBreakMinutes,
    settings.longBreakMinutes,
    settings.sessionLength,
    settings.longBreakAfterSession,
  ].join("|");
}

export interface UsePomodoroTimerOptions {
  /**
   * Called exactly once for every timer that runs to its end, with the
   * timer that just finished. It is never called when a timer is skipped,
   * restarted or replaced by changing the settings.
   */
  onTimerFinished?: (finishedTimer: PomodoroTimerState) => void;
}

export interface UsePomodoroTimerResult {
  timer: PomodoroTimerState;
  sequence: PomodoroSequenceItem[];
  currentItem: PomodoroSequenceItem;
  toggle: () => void;
  restart: () => void;
  previous: () => void;
  next: () => void;
}

export function usePomodoroTimer(
  settings: PomodoroSettingsProfile,
  options: UsePomodoroTimerOptions = {},
): UsePomodoroTimerResult {
  const configKey = getTimerConfigKey(settings);

  // Every field that buildPomodoroSequence reads is part of configKey.
  const sequence = useMemo(
    () => buildPomodoroSequence(settings),
    [configKey],
  );

  const [timer, setTimer] = useState<PomodoroTimerState>(() =>
    createTimerState(sequence[0], settings),
  );
  const [appliedConfigKey, setAppliedConfigKey] = useState(configKey);

  // The settings changed (another profile was selected, or a value was
  // edited): start over with the new settings. Updating state while
  // rendering is React's supported way to reset state in response to a
  // changed input, and it avoids rendering one frame with stale settings.
  if (appliedConfigKey !== configKey) {
    setAppliedConfigKey(configKey);
    setTimer(createTimerState(sequence[0], settings));
  }

  // The interval only exists while the timer is running. It does not
  // count anything: every tick asks the engine to compare the clock with
  // the deadline, so a late or missed tick can never make the timer drift.
  const isRunning = timer.status === "running";

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const intervalId = window.setInterval(() => {
      const now = Date.now();

      setTimer((current) => tickTimer(current, now));
    }, TICK_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [isRunning]);

  // Always call the latest callback without making the effect below
  // depend on it.
  const onTimerFinishedRef = useRef(options.onTimerFinished);

  useEffect(() => {
    onTimerFinishedRef.current = options.onTimerFinished;
  }, [options.onTimerFinished]);

  // Identifies the last timer we already reported as finished, so that a
  // finished timer can never be reported twice.
  const lastReportedRef = useRef<string | null>(null);

  // A timer that reaches its deadline becomes "finished" for exactly one
  // commit. This effect reports that completion (once), and is also the
  // explicit transition out of it: it loads the next timer, and starts it
  // only if auto-start is on.
  useEffect(() => {
    if (timer.status !== "finished") {
      return;
    }

    const reportKey = `${timer.currentSequenceIndex}:${timer.startedAt}`;

    if (lastReportedRef.current !== reportKey) {
      lastReportedRef.current = reportKey;
      onTimerFinishedRef.current?.(timer);
    }

    const now = Date.now();

    setTimer((current) =>
      completeTimer(current, sequence, settings, now),
    );
  }, [timer.status, sequence, settings]);

  const toggle = useCallback(() => {
    const now = Date.now();

    setTimer((current) => toggleTimer(current, now));
  }, []);

  const restart = useCallback(() => {
    setTimer((current) => restartTimer(current));
  }, []);

  const previous = useCallback(() => {
    setTimer((current) =>
      moveToPreviousTimer(current, sequence, settings),
    );
  }, [sequence, settings]);

  const next = useCallback(() => {
    setTimer((current) =>
      moveToNextTimer(current, sequence, settings),
    );
  }, [sequence, settings]);

  const currentItem = sequence[timer.currentSequenceIndex] ?? sequence[0];

  return { timer, sequence, currentItem, toggle, restart, previous, next };
}
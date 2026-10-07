export type PomodoroTimerType =
  | "focus"
  | "shortBreak"
  | "longBreak";

export type PomodoroTimerStatus =
  | "idle"
  | "running"
  | "paused"
  | "finished";

export interface PomodoroSettingsProfile {
  readonly id: string;
  name: string;

  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;

  sessionLength: number;
  autoStartNextTimer: boolean;

  longBreakAfterSession: number | null;
}

export interface PomodoroSession {
  readonly index: number;
  readonly type: PomodoroTimerType;
}

export interface PomodoroSequenceItem {
  readonly index: number;
  readonly type: PomodoroTimerType;

  /**
   * The Focus-session number this item belongs to.
   *
   * For example:
   *
   * Focus #2       -> 2
   * Short Break    -> 2
   * Long Break     -> 4
   */
  readonly sessionNumber: number;
}

export interface PomodoroTimerState {
  status: PomodoroTimerStatus;

  currentSequenceIndex: number;
  currentTimerType: PomodoroTimerType;

  durationSeconds: number;
  remainingSeconds: number;

  startedAt: number | null;
  endTime: number | null;
}
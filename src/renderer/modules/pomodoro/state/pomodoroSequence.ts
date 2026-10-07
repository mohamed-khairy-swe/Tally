import type {
  PomodoroSequenceItem,
  PomodoroSettingsProfile,
  PomodoroTimerType,
} from "../types";

type BreakType = Exclude<PomodoroTimerType, "focus">;

/**
 * Decides which break (if any) follows a given Focus session.
 *
 * Rule: every N Focus sessions the break is a Long Break, otherwise it is
 * a Short Break. A break whose duration is 0 is skipped entirely.
 */
function getBreakAfterSession(
  settings: PomodoroSettingsProfile,
  sessionNumber: number,
): BreakType | null {
  const { shortBreakMinutes, longBreakMinutes, longBreakAfterSession } =
    settings;

  const isLongBreakSession =
    longBreakMinutes > 0 &&
    longBreakAfterSession !== null &&
    longBreakAfterSession > 0 &&
    sessionNumber === longBreakAfterSession;

  if (isLongBreakSession) {
    return "longBreak";
  }

  if (shortBreakMinutes > 0) {
    return "shortBreak";
  }

  return null;
}

export function buildPomodoroSequence(
  settings: PomodoroSettingsProfile,
): PomodoroSequenceItem[] {
  const sequence: PomodoroSequenceItem[] = [];

  for (
    let sessionNumber = 1;
    sessionNumber <= settings.sessionLength;
    sessionNumber++
  ) {
    sequence.push({
      index: sequence.length,
      type: "focus",
      sessionNumber,
    });

    const breakType = getBreakAfterSession(settings, sessionNumber);

    if (breakType !== null) {
      sequence.push({
        index: sequence.length,
        type: breakType,
        sessionNumber,
      });
    }
  }

  return sequence;
}

export function getNextSequenceIndex(
  currentIndex: number,
  sequenceLength: number,
): number {
  if (sequenceLength <= 0) {
    return 0;
  }

  return (currentIndex + 1) % sequenceLength;
}

export function getPreviousSequenceIndex(
  currentIndex: number,
  sequenceLength: number,
): number {
  if (sequenceLength <= 0) {
    return 0;
  }

  return (currentIndex - 1 + sequenceLength) % sequenceLength;
}
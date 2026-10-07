import type { PomodoroSettingsProfile } from "../types";

export const DEFAULT_POMODORO_SETTINGS: PomodoroSettingsProfile = {
  id: "default",
  name: "Default",

  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,

  sessionLength: 4,
  autoStartNextTimer: false,

  longBreakAfterSession: 4,
};

export function validatePomodoroSettings(
  settings: PomodoroSettingsProfile,
): string[] {
  const errors: string[] = [];

  if (
    !Number.isInteger(settings.focusMinutes) ||
    settings.focusMinutes < 1
  ) {
    errors.push("Focus duration must be at least 1 minute.");
  }

  if (
    !Number.isInteger(settings.shortBreakMinutes) ||
    settings.shortBreakMinutes < 0
  ) {
    errors.push(
      "Short break duration cannot be negative.",
    );
  }

  if (
    !Number.isInteger(settings.longBreakMinutes) ||
    settings.longBreakMinutes < 0
  ) {
    errors.push(
      "Long break duration cannot be negative.",
    );
  }

  if (
    !Number.isInteger(settings.sessionLength) ||
    settings.sessionLength < 1 ||
    settings.sessionLength > 10
  ) {
    errors.push(
      "Session length must be between 1 and 10.",
    );
  }

  if (settings.longBreakMinutes === 0) {
    if (settings.longBreakAfterSession !== null) {
      errors.push(
        "Long break timing must be disabled when the long break is disabled.",
      );
    }
  } else if (
    settings.longBreakAfterSession === null ||
    !Number.isInteger(settings.longBreakAfterSession) ||
    settings.longBreakAfterSession < 1 ||
    settings.longBreakAfterSession > settings.sessionLength
  ) {
    errors.push(
      "Long break timing must be between 1 and the session length.",
    );
  }

  return errors;
}


export interface PomodoroSettingsState {
  profiles: PomodoroSettingsProfile[];
  activeProfileId: string;
}

export const INITIAL_POMODORO_SETTINGS_STATE: PomodoroSettingsState = {
  profiles: [DEFAULT_POMODORO_SETTINGS],
  activeProfileId: DEFAULT_POMODORO_SETTINGS.id,
};

export function updatePomodoroSettings(
  settings: PomodoroSettingsProfile,
  updates: Partial<PomodoroSettingsProfile>,
): PomodoroSettingsProfile {
  return {
    ...settings,
    ...updates,
  };
}
import type { PomodoroSettingsProfile } from "../types";
import { electronStorage } from "../../../storage/electronStorage";
import {
  DEFAULT_POMODORO_SETTINGS,
  INITIAL_POMODORO_SETTINGS_STATE,
  type PomodoroSettingsState,
} from "./pomodoroSettings";

export const POMODORO_STORAGE_KEY = "tally.pomodoro.v1";

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function isPomodoroProfile(value: unknown): value is PomodoroSettingsProfile {
  if (value === null || typeof value !== "object") return false;
  const p = value as PomodoroSettingsProfile;
  return (
    typeof p.id === "string" &&
    typeof p.name === "string" &&
    Number.isInteger(p.focusMinutes) &&
    p.focusMinutes >= 1 &&
    Number.isInteger(p.shortBreakMinutes) &&
    p.shortBreakMinutes >= 0 &&
    Number.isInteger(p.longBreakMinutes) &&
    p.longBreakMinutes >= 0 &&
    Number.isInteger(p.sessionLength) &&
    p.sessionLength >= 1 &&
    p.sessionLength <= 10 &&
    typeof p.autoStartNextTimer === "boolean" &&
    (p.longBreakAfterSession === null ||
      Number.isInteger(p.longBreakAfterSession))
  );
}

function isPomodoroSettingsState(
  value: unknown,
): value is PomodoroSettingsState {
  if (value === null || typeof value !== "object") return false;
  const s = value as PomodoroSettingsState;
  return (
    Array.isArray(s.profiles) &&
    s.profiles.length > 0 &&
    s.profiles.every(isPomodoroProfile) &&
    typeof s.activeProfileId === "string"
  );
}

// ---------------------------------------------------------------------------
// Load / Save
// ---------------------------------------------------------------------------

export function loadPomodoroSettingsState(
  storage: Pick<Storage, "getItem"> = electronStorage,
): PomodoroSettingsState {
  try {
    const raw = storage.getItem(POMODORO_STORAGE_KEY);
    if (raw === null) return { ...INITIAL_POMODORO_SETTINGS_STATE };

    const parsed: unknown = JSON.parse(raw);
    if (!isPomodoroSettingsState(parsed)) {
      return { ...INITIAL_POMODORO_SETTINGS_STATE };
    }

    // Ensure the activeProfileId still points at an existing profile
    const profileExists = parsed.profiles.some(
      (p) => p.id === parsed.activeProfileId,
    );
    if (!profileExists) {
      return { ...parsed, activeProfileId: parsed.profiles[0].id };
    }

    return parsed;
  } catch {
    return { ...INITIAL_POMODORO_SETTINGS_STATE };
  }
}

export function savePomodoroSettingsState(
  state: PomodoroSettingsState,
  storage: Pick<Storage, "setItem"> = electronStorage,
): void {
  storage.setItem(POMODORO_STORAGE_KEY, JSON.stringify(state));
}

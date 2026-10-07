import type {
  Habit,
  HabitCategory,
  HabitOccurrence,
  HabitSettings,
} from "../types";
import { electronStorage } from "../../../storage/electronStorage";

export const HABITS_STORAGE_KEY = "tally.habits.v1";

export const DEFAULT_HABIT_SETTINGS: HabitSettings = {
  firstDayOfWeek: 1,
  defaultCompletedColor: "#386a20",
  defaultPartialColor: "#c47c16",
};

export interface HabitsSnapshot {
  habits: Habit[];
  categories: HabitCategory[];
  occurrences: HabitOccurrence[];
  settings: HabitSettings;
}

export function createEmptyHabitsSnapshot(): HabitsSnapshot {
  return {
    habits: [],
    categories: [],
    occurrences: [],
    settings: { ...DEFAULT_HABIT_SETTINGS },
  };
}

function isHabitSettings(value: unknown): value is HabitSettings {
  if (value === null || typeof value !== "object") {
    return false;
  }

  const settings = value as HabitSettings;

  return (
    Number.isInteger(settings.firstDayOfWeek) &&
    settings.firstDayOfWeek >= 0 &&
    settings.firstDayOfWeek <= 6 &&
    typeof settings.defaultCompletedColor === "string" &&
    typeof settings.defaultPartialColor === "string"
  );
}

function isSnapshot(value: unknown): value is HabitsSnapshot {
  if (value === null || typeof value !== "object") {
    return false;
  }

  const snapshot = value as HabitsSnapshot;

  return (
    Array.isArray(snapshot.habits) &&
    Array.isArray(snapshot.categories) &&
    Array.isArray(snapshot.occurrences) &&
    isHabitSettings(snapshot.settings)
  );
}

export function loadHabitsSnapshot(
  storage: Pick<Storage, "getItem"> = electronStorage,
): HabitsSnapshot {
  try {
    const raw = storage.getItem(HABITS_STORAGE_KEY);

    if (raw === null) {
      return createEmptyHabitsSnapshot();
    }

    const parsed: unknown = JSON.parse(raw);

    if (!isSnapshot(parsed)) {
      return createEmptyHabitsSnapshot();
    }

    return parsed;
  } catch {
    return createEmptyHabitsSnapshot();
  }
}

export function saveHabitsSnapshot(
  snapshot: HabitsSnapshot,
  storage: Pick<Storage, "setItem"> = electronStorage,
): void {
  storage.setItem(HABITS_STORAGE_KEY, JSON.stringify(snapshot));
}

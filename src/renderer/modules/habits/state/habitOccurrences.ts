import type {
  Habit,
  HabitConfiguration,
  HabitDate,
  HabitOccurrence,
} from "../types";

import {
  getConfigurationForDate,
  isHabitScheduledForDate,
} from "./habitSchedule";



export function getOccurrenceConfiguration(
  habit: Habit,
  date: HabitDate,
): HabitConfiguration | null {
  if (date < habit.startDate) {
    return null;
  }

  return getConfigurationForDate(
    habit.configurations,
    date,
  );
}

export function isOccurrenceScheduled(
  habit: Habit,
  date: HabitDate,
): boolean {
  const configuration =
    getOccurrenceConfiguration(
      habit,
      date,
    );

  if (configuration === null) {
    return false;
  }

  return isHabitScheduledForDate(
    configuration,
    date,
  );
}

export function upsertOccurrence(
  occurrences: readonly HabitOccurrence[],
  occurrence: HabitOccurrence,
): HabitOccurrence[] {
  const existingIndex = occurrences.findIndex(
    (current) =>
      current.habitId === occurrence.habitId &&
      current.date === occurrence.date,
  );

  if (existingIndex === -1) {
    return [...occurrences, occurrence];
  }

  return occurrences.map((current, index) =>
    index === existingIndex ? occurrence : current,
  );
}

export function findOccurrence(
  occurrences: readonly HabitOccurrence[],
  habitId: string,
  date: HabitDate,
): HabitOccurrence | null {
  return (
    occurrences.find(
      (occurrence) =>
        occurrence.habitId === habitId &&
        occurrence.date === date,
    ) ?? null
  );
}

export function createOccurrence(
  habit: Habit,
  date: HabitDate,
): HabitOccurrence | null {
  const configuration =
    getOccurrenceConfiguration(
      habit,
      date,
    );

  if (configuration === null) {
    return null;
  }

  if (
    !isHabitScheduledForDate(
      configuration,
      date,
    )
  ) {
    return null;
  }

  return {
    habitId: habit.id,
    date,
    configurationId:
      configuration.id,
    progress: 0,
  };
}

export function completeBinaryOccurrence(
  occurrence: HabitOccurrence,
): HabitOccurrence {
  return {
    ...occurrence,
    progress: 1,
  };
}

export function resetBinaryOccurrence(
  occurrence: HabitOccurrence,
): HabitOccurrence {
  return {
    ...occurrence,
    progress: 0,
  };
}

export function incrementProgressiveOccurrence(
  occurrence: HabitOccurrence,
  configuration: HabitConfiguration,
): HabitOccurrence {
  if (
    configuration.trackingType !==
    "progressive"
  ) {
    throw new Error(
      "Cannot increment a binary occurrence.",
    );
  }

  if (
    configuration.target === null ||
    configuration.increment === null
  ) {
    throw new Error(
      "Progressive configuration is incomplete.",
    );
  }

  const nextProgress = Math.min(
    occurrence.progress +
      configuration.increment,
    configuration.target,
  );

  return {
    ...occurrence,
    progress: nextProgress,
  };
}

export function decrementProgressiveOccurrence(
  occurrence: HabitOccurrence,
  configuration: HabitConfiguration,
): HabitOccurrence {
  if (
    configuration.trackingType !==
    "progressive"
  ) {
    throw new Error(
      "Cannot decrement a binary occurrence.",
    );
  }

  if (
    configuration.increment === null
  ) {
    throw new Error(
      "Progressive configuration is incomplete.",
    );
  }

  const nextProgress = Math.max(
    occurrence.progress -
      configuration.increment,
    0,
  );

  return {
    ...occurrence,
    progress: nextProgress,
  };
}

export function resetProgressiveOccurrence(
  occurrence: HabitOccurrence,
): HabitOccurrence {
  return {
    ...occurrence,
    progress: 0,
  };
}

export type HabitOccurrenceState =
  | "incomplete"
  | "partial"
  | "completed";

  export function getOccurrenceState(
  occurrence: HabitOccurrence,
  configuration: HabitConfiguration,
): HabitOccurrenceState {
  if (
    configuration.trackingType ===
    "binary"
  ) {
    return occurrence.progress >= 1
      ? "completed"
      : "incomplete";
  }

  if (
    configuration.target === null
  ) {
    return "incomplete";
  }

  if (occurrence.progress >= configuration.target) {
    return "completed";
  }

  if (occurrence.progress > 0) {
    return "partial";
  }

  return "incomplete";
}
import type {
  Habit,
  HabitConfiguration,
  HabitDate,
  HabitOccurrence,
} from "../types";

import {
  createOccurrence,
  findOccurrence,
  getOccurrenceConfiguration,
  getOccurrenceState,
  isOccurrenceScheduled,
} from "./habitOccurrences";
import { isHabitScheduledForDate } from "./habitSchedule";

import {
  completeBinaryOccurrence,
  resetBinaryOccurrence,
  incrementProgressiveOccurrence,
  decrementProgressiveOccurrence,
  resetProgressiveOccurrence,
} from "./habitOccurrences";

export type HabitTrackingError =
  | "future_date"
  | "before_start"
  | "not_scheduled"
  | "missing_configuration"
  | "missing_occurrence"
  | "wrong_tracking_type";

  export function isDateEditable(
  date: HabitDate,
  today: HabitDate,
): boolean {
  return date <= today;
}

function getOrCreateOccurrence(
  habit: Habit,
  occurrences: readonly HabitOccurrence[],
  date: HabitDate,
): HabitOccurrence | null {
  const existing = findOccurrence(
    occurrences,
    habit.id,
    date,
  );

  if (existing !== null) {
    return existing;
  }

  return createOccurrence(
    habit,
    date,
  );
}

export interface HabitTrackingResult {
  readonly success: boolean;

  readonly occurrence: HabitOccurrence | null;

  readonly error: HabitTrackingError | null;
}


function validateTrackingDate(
  habit: Habit,
  date: HabitDate,
  today: HabitDate,
): HabitTrackingError | null {
  if (date > today) {
    return "future_date";
  }

  if (date < habit.startDate) {
    return "before_start";
  }

  if (
    getOccurrenceConfiguration(
      habit,
      date,
    ) === null
  ) {
    return "missing_configuration";
  }

  if (
    !isOccurrenceScheduled(
      habit,
      date,
    )
  ) {
    return "not_scheduled";
  }

  return null;
}

export function completeHabit(
  habit: Habit,
  occurrences: readonly HabitOccurrence[],
  date: HabitDate,
  today: HabitDate,
): HabitTrackingResult {
  const error = validateTrackingDate(
    habit,
    date,
    today,
  );

  if (error !== null) {
    return {
      success: false,
      occurrence: null,
      error,
    };
  }

  const configuration =
    getOccurrenceConfiguration(
      habit,
      date,
    );

  if (
    configuration === null ||
    configuration.trackingType !== "binary"
  ) {
    return {
      success: false,
      occurrence: null,
      error: "wrong_tracking_type",
    };
  }

  const occurrence =
    getOrCreateOccurrence(
      habit,
      occurrences,
      date,
    );

  if (occurrence === null) {
    return {
      success: false,
      occurrence: null,
      error: "missing_occurrence",
    };
  }

  return {
    success: true,
    occurrence:
      completeBinaryOccurrence(
        occurrence,
      ),
    error: null,
  };
}

export function resetHabit(
  habit: Habit,
  occurrences: readonly HabitOccurrence[],
  date: HabitDate,
  today: HabitDate,
): HabitTrackingResult {
  const error = validateTrackingDate(
    habit,
    date,
    today,
  );

  if (error !== null) {
    return {
      success: false,
      occurrence: null,
      error,
    };
  }

  const configuration =
    getOccurrenceConfiguration(
      habit,
      date,
    );

  if (configuration === null) {
    return {
      success: false,
      occurrence: null,
      error: "missing_configuration",
    };
  }

  const occurrence =
    findOccurrence(
      occurrences,
      habit.id,
      date,
    );

  if (occurrence === null) {
    return {
      success: false,
      occurrence: null,
      error: "missing_occurrence",
    };
  }

  if (
    configuration.trackingType ===
    "binary"
  ) {
    return {
      success: true,
      occurrence:
        resetBinaryOccurrence(
          occurrence,
        ),
      error: null,
    };
  }

  return {
    success: true,
    occurrence:
      resetProgressiveOccurrence(
        occurrence,
      ),
    error: null,
  };
}

export function incrementHabit(
  habit: Habit,
  occurrences: readonly HabitOccurrence[],
  date: HabitDate,
  today: HabitDate,
): HabitTrackingResult {
  const error = validateTrackingDate(
    habit,
    date,
    today,
  );

  if (error !== null) {
    return {
      success: false,
      occurrence: null,
      error,
    };
  }

  const configuration =
    getOccurrenceConfiguration(
      habit,
      date,
    );

  if (
    configuration === null ||
    configuration.trackingType !==
      "progressive"
  ) {
    return {
      success: false,
      occurrence: null,
      error: "wrong_tracking_type",
    };
  }

  const occurrence =
    getOrCreateOccurrence(
      habit,
      occurrences,
      date,
    );

  if (occurrence === null) {
    return {
      success: false,
      occurrence: null,
      error: "missing_occurrence",
    };
  }

  return {
    success: true,
    occurrence:
      incrementProgressiveOccurrence(
        occurrence,
        configuration,
      ),
    error: null,
  };
}

export function decrementHabit(
  habit: Habit,
  occurrences: readonly HabitOccurrence[],
  date: HabitDate,
  today: HabitDate,
): HabitTrackingResult {
  const error = validateTrackingDate(
    habit,
    date,
    today,
  );

  if (error !== null) {
    return {
      success: false,
      occurrence: null,
      error,
    };
  }

  const configuration =
    getOccurrenceConfiguration(
      habit,
      date,
    );

  if (
    configuration === null ||
    configuration.trackingType !==
      "progressive"
  ) {
    return {
      success: false,
      occurrence: null,
      error: "wrong_tracking_type",
    };
  }

  const occurrence =
    findOccurrence(
      occurrences,
      habit.id,
      date,
    );

  if (occurrence === null) {
    return {
      success: false,
      occurrence: null,
      error: "missing_occurrence",
    };
  }

  return {
    success: true,
    occurrence:
      decrementProgressiveOccurrence(
        occurrence,
        configuration,
      ),
    error: null,
  };
}

export interface HabitDateState {
  readonly scheduled: boolean;

  readonly occurrence:
    | HabitOccurrence
    | null;

  readonly configuration:
    | HabitConfiguration
    | null;

  readonly state:
    | "notApplicable"
    | "upcoming"
    | "incomplete"
    | "partial"
    | "completed";
}

export function getHabitDateState(
  habit: Habit,
  occurrences: readonly HabitOccurrence[],
  date: HabitDate,
  today: HabitDate,
): HabitDateState {
  if (date < habit.startDate) {
    return {
      scheduled: false,
      occurrence: null,
      configuration: null,
      state: "notApplicable",
    };
  }

  const configuration =
    getOccurrenceConfiguration(
      habit,
      date,
    );

  if (configuration === null) {
    return {
      scheduled: false,
      occurrence: null,
      configuration: null,
      state: "notApplicable",
    };
  }

  const scheduled =
    isHabitScheduledForDate(
      configuration,
      date,
    );

  if (!scheduled) {
    return {
      scheduled: false,
      occurrence: null,
      configuration,
      state: "notApplicable",
    };
  }

  if (date > today) {
    return {
      scheduled: true,
      occurrence: null,
      configuration,
      state: "upcoming",
    };
  }

  const occurrence =
    findOccurrence(
      occurrences,
      habit.id,
      date,
    );

  if (occurrence === null) {
    return {
      scheduled: true,
      occurrence: null,
      configuration,
      state: "incomplete",
    };
  }

  return {
    scheduled: true,
    occurrence,
    configuration,
    state: getOccurrenceState(
      occurrence,
      configuration,
    ),
  };
}
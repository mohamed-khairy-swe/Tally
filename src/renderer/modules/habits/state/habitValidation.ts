import type {
  HabitSchedule,
  HabitTrackingType,
  HabitConfiguration,
} from "../types";


export interface HabitValidationResult {
  readonly valid: boolean;
  readonly errors: Partial<
    Record<
      | "name"
      | "schedule"
      | "weekdays"
      | "monthDays"
      | "target"
      | "increment"
      | "unit",
      string
    >
  >;
}

export function validateHabitName(
  name: string,
): string | null {
  const trimmedName = name.trim();

  if (trimmedName.length === 0) {
    return "Habit name cannot be empty.";
  }

  if (trimmedName.length > 80) {
    return "Habit name cannot exceed 80 characters.";
  }

  return null;
}

export function validateSchedule(
  schedule: HabitSchedule,
): HabitValidationResult {
  const errors: HabitValidationResult["errors"] = {};

  if (schedule.type === "weekly") {
    if (schedule.weekdays.length === 0) {
      errors.weekdays = "Select at least one day.";
    }

    const hasInvalidWeekday =
      schedule.weekdays.some(
        (weekday) =>
          !Number.isInteger(weekday) ||
          weekday < 0 ||
          weekday > 6,
      );

    if (hasInvalidWeekday) {
      errors.weekdays =
        "Weekdays must be between 0 and 6.";
    }
  }

  if (schedule.type === "monthly") {
    if (schedule.monthDays.length === 0) {
      errors.monthDays =
        "Select at least one day of the month.";
    }

    const hasInvalidMonthDay =
      schedule.monthDays.some(
        (day) =>
          !Number.isInteger(day) ||
          day < 1 ||
          day > 31,
      );

    if (hasInvalidMonthDay) {
      errors.monthDays =
        "Month days must be between 1 and 31.";
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateProgressiveConfiguration(
  configuration: HabitConfiguration,
): HabitValidationResult {
  const errors: HabitValidationResult["errors"] = {};

  if (configuration.trackingType !== "progressive") {
    return {
      valid: true,
      errors,
    };
  }

  const target = configuration.target;
  const increment = configuration.increment;

  if (
    target === null ||
    !Number.isInteger(target) ||
    target <= 0
  ) {
    errors.target =
      "Target must be a positive integer.";
  }

  if (
    increment === null ||
    !Number.isInteger(increment) ||
    increment <= 0
  ) {
    errors.increment =
      "Increment must be a positive integer.";
  }

  if (
    target !== null &&
    increment !== null &&
    Number.isInteger(target) &&
    Number.isInteger(increment)
  ) {
    if (increment > target) {
      errors.increment =
        "Increment cannot exceed the target.";
    }

    if (target % increment !== 0) {
      errors.increment =
        "Target must be evenly divisible by increment.";
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateHabitConfiguration(
  configuration: HabitConfiguration,
): HabitValidationResult {
  const errors: HabitValidationResult["errors"] = {};

  const scheduleResult = validateSchedule(
    configuration.schedule,
  );

  Object.assign(errors, scheduleResult.errors);

  const progressiveResult =
    validateProgressiveConfiguration(
      configuration,
    );

  Object.assign(
    errors,
    progressiveResult.errors,
  );

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      configuration.effectiveFrom,
    )
  ) {
    errors.schedule =
      "Effective date must use YYYY-MM-DD format.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}


export interface CreateHabitConfigurationInput {
  effectiveFrom: string;
  trackingType: HabitTrackingType;
  schedule: HabitSchedule;
  target?: number;
  increment?: number;
  unit?: string;
}

export function createHabitConfiguration(
  input: CreateHabitConfigurationInput,
): HabitConfiguration {
  const isProgressive =
    input.trackingType === "progressive";

  return {
    id: crypto.randomUUID(),

    effectiveFrom: input.effectiveFrom,

    trackingType: input.trackingType,

    schedule: {
      type: input.schedule.type,
      weekdays: [...input.schedule.weekdays],
      monthDays: [...input.schedule.monthDays],
    },

    target: isProgressive
      ? input.target ?? null
      : null,

    increment: isProgressive
      ? input.increment ?? null
      : null,

    unit: isProgressive
      ? input.unit?.trim() || null
      : null,
  };
}
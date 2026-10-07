import type {
  Habit,
  HabitConfiguration,
} from "../types";

import {
  validateHabitConfiguration,
  validateHabitName,
} from "./habitValidation";
import { addCalendarDays } from "./habitCalendar";
import type { HabitDate } from "../types";

export interface ConfigurationUpdateResult {
  readonly habit: Habit | null;
  readonly errors: string[];
}

export function addHabitConfiguration(
  habit: Habit,
  configuration: HabitConfiguration,
): ConfigurationUpdateResult {
  const validation =
    validateHabitConfiguration(
      configuration,
    );

  if (!validation.valid) {
    return {
      habit: null,
      errors: Object.values(
        validation.errors,
      ),
    };
  }

  const existingConfiguration =
    habit.configurations.find(
      (current) =>
        current.effectiveFrom ===
        configuration.effectiveFrom,
    );

  const configurations =
    existingConfiguration === undefined
      ? [
          ...habit.configurations,
          configuration,
        ]
      : habit.configurations.map(
          (current) =>
            current.effectiveFrom ===
            configuration.effectiveFrom
              ? configuration
              : current,
        );

  configurations.sort(
    (a, b) =>
      a.effectiveFrom.localeCompare(
        b.effectiveFrom,
      ),
  );

  return {
    habit: {
      ...habit,
      configurations,
    },
    errors: [],
  };
}

export interface CreateHabitInput {
  name: string;
  categoryId: string | null;
  startDate: string;

  completedColor: string;
  partialColor: string;

  configuration: HabitConfiguration;
}

export interface CreateHabitResult {
  readonly habit: Habit | null;
  readonly errors: string[];
}

export function createHabit(
  input: CreateHabitInput,
): CreateHabitResult {
  const errors: string[] = [];

  const nameError = validateHabitName(input.name);

  if (nameError !== null) {
    errors.push(nameError);
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      input.startDate,
    )
  ) {
    errors.push(
      "Start date must use YYYY-MM-DD format.",
    );
  }

  const configurationValidation =
    validateHabitConfiguration(
      input.configuration,
    );

  if (!configurationValidation.valid) {
    errors.push(
      ...Object.values(
        configurationValidation.errors,
      ),
    );
  }

  if (
    input.configuration.effectiveFrom !==
    input.startDate
  ) {
    errors.push(
      "The initial configuration must begin on the habit start date.",
    );
  }

  if (errors.length > 0) {
    return {
      habit: null,
      errors,
    };
  }

  const habit: Habit = {
    id: crypto.randomUUID(),

    name: input.name.trim(),

    categoryId: input.categoryId,

    startDate: input.startDate,

    archived: false,

    completedColor: input.completedColor,
    partialColor: input.partialColor,

    configurations: [
      input.configuration,
    ],
  };

  return {
    habit,
    errors: [],
  };
}

export function updateHabitMetadata(
  habit: Habit,
  updates: {
    name?: string;
    categoryId?: string | null;
    completedColor?: string;
    partialColor?: string;
  },
): CreateHabitResult {
  const name = updates.name ?? habit.name;
  const nameError = validateHabitName(name);

  if (nameError !== null) {
    return {
      habit: null,
      errors: [nameError],
    };
  }

  return {
    habit: {
      ...habit,
      name: name.trim(),
      categoryId:
        updates.categoryId === undefined
          ? habit.categoryId
          : updates.categoryId,
      completedColor:
        updates.completedColor ?? habit.completedColor,
      partialColor:
        updates.partialColor ?? habit.partialColor,
    },
    errors: [],
  };
}

/**
 * Schedule and tracking changes apply from tomorrow so today's
 * existing occurrence keeps its current configuration.
 */
export function applyFutureConfiguration(
  habit: Habit,
  configuration: HabitConfiguration,
  today: HabitDate,
): ConfigurationUpdateResult {
  return addHabitConfiguration(habit, {
    ...configuration,
    id: crypto.randomUUID(),
    effectiveFrom: addCalendarDays(today, 1),
  });
}

export function archiveHabit(habit: Habit): Habit {
  return {
    ...habit,
    archived: true,
  };
}

export function restoreHabit(habit: Habit): Habit {
  return {
    ...habit,
    archived: false,
  };
}
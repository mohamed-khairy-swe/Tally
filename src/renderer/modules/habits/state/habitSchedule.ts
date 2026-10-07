import type {
  HabitConfiguration,
  HabitDate,
} from "../types";

import {
  getWeekday,
  parseHabitDate,
} from "./habitDates";

export function isHabitScheduledForDate(
  configuration: HabitConfiguration,
  date: HabitDate,
): boolean {
  const { day } = parseHabitDate(date);

  switch (configuration.schedule.type) {
    case "daily":
      return true;

    case "weekly": {
      const weekday = getWeekday(date);

      return configuration.schedule.weekdays.includes(
        weekday,
      );
    }

    case "monthly":
      return configuration.schedule.monthDays.includes(
        day,
      );
  }
}


export function getConfigurationForDate(
  configurations: readonly HabitConfiguration[],
  date: HabitDate,
): HabitConfiguration | null {
  if (configurations.length === 0) {
    return null;
  }

  const applicableConfigurations =
    configurations.filter(
      (configuration) =>
        configuration.effectiveFrom <= date,
    );

  if (applicableConfigurations.length === 0) {
    return null;
  }

  return applicableConfigurations.reduce(
    (latest, configuration) =>
      configuration.effectiveFrom >
      latest.effectiveFrom
        ? configuration
        : latest,
  );
}

export function isHabitScheduledOnDate(
  configurations: readonly HabitConfiguration[],
  date: HabitDate,
): boolean {
  const configuration =
    getConfigurationForDate(
      configurations,
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
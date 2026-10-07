import type {
  Habit,
  HabitDate,
  HabitOccurrence,
} from "../types";

import {
  findOccurrence,
  getOccurrenceConfiguration,
  getOccurrenceState,
  isOccurrenceScheduled,
} from "./habitOccurrences";

import {
  parseHabitDate,
} from "./habitDates";

function getPreviousDate(
  date: HabitDate,
): HabitDate {
  const { year, month, day } =
    parseHabitDate(date);

  const previous = new Date(
    Date.UTC(
      year,
      month - 1,
      day - 1,
    ),
  );

  return [
    previous.getUTCFullYear()
      .toString()
      .padStart(4, "0"),

    (previous.getUTCMonth() + 1)
      .toString()
      .padStart(2, "0"),

    previous.getUTCDate()
      .toString()
      .padStart(2, "0"),
  ].join("-");
}

function isCompletedOccurrence(
  habit: Habit,
  occurrence: HabitOccurrence,
): boolean {
  const configuration =
    getOccurrenceConfiguration(
      habit,
      occurrence.date,
    );

  if (configuration === null) {
    return false;
  }

  return (
    getOccurrenceState(
      occurrence,
      configuration,
    ) === "completed"
  );
}

export function calculateCurrentStreak(
  habit: Habit,
  occurrences: readonly HabitOccurrence[],
  today: HabitDate,
): number {
  if (today < habit.startDate) {
    return 0;
  }

  let currentDate = today;
  let streak = 0;
  let skippedIncompleteToday = false;

  while (currentDate >= habit.startDate) {
    if (
      isOccurrenceScheduled(
        habit,
        currentDate,
      )
    ) {
      const occurrence =
        findOccurrence(
          occurrences,
          habit.id,
          currentDate,
        );

      const completed =
        occurrence !== null &&
        isCompletedOccurrence(
          habit,
          occurrence,
        );

      if (!completed) {
        if (
          currentDate === today &&
          !skippedIncompleteToday
        ) {
          skippedIncompleteToday = true;
          currentDate =
            getPreviousDate(currentDate);
          continue;
        }

        break;
      }

      streak++;
    }

    currentDate =
      getPreviousDate(currentDate);
  }

  return streak;
}

export function isDateCompletedForHabit(
  habit: Habit,
  occurrences: readonly HabitOccurrence[],
  date: HabitDate,
): boolean {
  if (
    !isOccurrenceScheduled(
      habit,
      date,
    )
  ) {
    return false;
  }

  const occurrence =
    findOccurrence(
      occurrences,
      habit.id,
      date,
    );

  if (occurrence === null) {
    return false;
  }

  return isCompletedOccurrence(
    habit,
    occurrence,
  );
}
import type {
  Habit,
  HabitCategory,
  HabitDate,
  HabitOccurrence,
} from "../types";

import {
  getHabitDateState,
} from "./habitTracking";

import {
  isDateCompletedForHabit,
} from "./habitStreaks";

import {
  calculateCurrentStreak,
} from "./habitStreaks";

import {
  addCalendarDays,
} from "./habitCalendar";

export interface HabitCalendarDay {
  readonly date: HabitDate;

  readonly scheduled: boolean;

  readonly editable: boolean;

  readonly state:
    | "notApplicable"
    | "upcoming"
    | "incomplete"
    | "partial"
    | "completed";

  readonly progress: number | null;

  readonly target: number | null;

  readonly trackingType:
    | "binary"
    | "progressive"
    | null;

  readonly unit: string | null;

  readonly occurrence:
    | HabitOccurrence
    | null;

  readonly category:
    | HabitCategory
    | null;
}

export function createHabitCalendarDay(
  habit: Habit,
  occurrences: readonly HabitOccurrence[],
  categories: readonly HabitCategory[],
  date: HabitDate,
  today: HabitDate,
): HabitCalendarDay {
  const dateState =
    getHabitDateState(
      habit,
      occurrences,
      date,
      today,
    );

  const category =
    habit.categoryId === null
      ? null
      : (
          categories.find(
            (item) =>
              item.id === habit.categoryId,
          ) ?? null
        );

  return {
    date,

    scheduled:
      dateState.scheduled,

    editable:
      date <= today &&
      date >= habit.startDate &&
      dateState.scheduled,

    state:
      dateState.state,

    progress:
      dateState.occurrence?.progress
        ?? null,

    target:
      dateState.configuration?.target
        ?? null,

    trackingType:
      dateState.configuration
        ?.trackingType
        ?? null,

    unit:
      dateState.configuration?.unit
        ?? null,

    occurrence:
      dateState.occurrence,

    category,
  };
}

export function createHabitCalendarDays(
  habit: Habit,
  occurrences: readonly HabitOccurrence[],
  categories: readonly HabitCategory[],
  startDate: HabitDate,
  endDate: HabitDate,
  today: HabitDate,
): HabitCalendarDay[] {
  if (startDate > endDate) {
    throw new Error(
      "Calendar start date cannot be after end date.",
    );
  }

  const days: HabitCalendarDay[] = [];

  let currentDate = startDate;

  while (currentDate <= endDate) {
    days.push(
      createHabitCalendarDay(
        habit,
        occurrences,
        categories,
        currentDate,
        today,
      ),
    );

    currentDate =
      addCalendarDays(
        currentDate,
        1,
      );
  }

  return days;
}

export interface HabitCalendarDayWithPosition
  extends HabitCalendarDay {
  readonly isToday: boolean;
  readonly isSelected: boolean;
}

export function addCalendarDayPosition(
  days: readonly HabitCalendarDay[],
  today: HabitDate,
  selectedDate: HabitDate,
): HabitCalendarDayWithPosition[] {
  return days.map(
    (day) => ({
      ...day,

      isToday:
        day.date === today,

      isSelected:
        day.date === selectedDate,
    }),
  );
}

export interface HabitSummary {
  readonly habitId: string;

  readonly name: string;

  readonly category:
    | HabitCategory
    | null;

  readonly archived: boolean;

  readonly trackingType:
    | "binary"
    | "progressive"
    | null;

  readonly today: HabitCalendarDay;
}

export function createHabitSummary(
  habit: Habit,
  occurrences: readonly HabitOccurrence[],
  categories: readonly HabitCategory[],
  today: HabitDate,
): HabitSummary {
  const todayState =
    createHabitCalendarDay(
      habit,
      occurrences,
      categories,
      today,
      today,
    );

  const category =
    habit.categoryId === null
      ? null
      : (
          categories.find(
            (item) =>
              item.id === habit.categoryId,
          ) ?? null
        );

  return {
    habitId: habit.id,

    name: habit.name,

    category,

    archived:
      habit.archived,

    trackingType:
      todayState.trackingType,

    today:
      todayState,
  };
}

export interface HabitHeatmapCell {
  readonly date: HabitDate;

  readonly state:
    | "notApplicable"
    | "upcoming"
    | "incomplete"
    | "partial"
    | "completed";

  readonly scheduled: boolean;

  readonly editable: boolean;

  readonly progress: number | null;

  readonly target: number | null;

  readonly completionRatio: number;

  readonly isToday: boolean;
}

function getCompletionRatio(
  progress: number | null,
  target: number | null,
): number {
  if (
    progress === null ||
    target === null ||
    target <= 0
  ) {
    return 0;
  }

  return Math.min(
    progress / target,
    1,
  );
}

export function createHabitHeatmapCell(
  habit: Habit,
  occurrences: readonly HabitOccurrence[],
  categories: readonly HabitCategory[],
  date: HabitDate,
  today: HabitDate,
): HabitHeatmapCell {
  const day =
    createHabitCalendarDay(
      habit,
      occurrences,
      categories,
      date,
      today,
    );

  return {
    date,

    state:
      day.state,

    scheduled:
      day.scheduled,

    editable:
      day.editable,

    progress:
      day.progress,

    target:
      day.target,

    completionRatio:
      getCompletionRatio(
        day.progress,
        day.target,
      ),

    isToday:
      date === today,
  };
}

export function createHabitHeatmap(
  habit: Habit,
  occurrences: readonly HabitOccurrence[],
  categories: readonly HabitCategory[],
  startDate: HabitDate,
  endDate: HabitDate,
  today: HabitDate,
): HabitHeatmapCell[] {
  if (startDate > endDate) {
    throw new Error(
      "Heatmap start date cannot be after end date.",
    );
  }

  const cells: HabitHeatmapCell[] = [];

  let currentDate = startDate;

  while (currentDate <= endDate) {
    cells.push(
      createHabitHeatmapCell(
        habit,
        occurrences,
        categories,
        currentDate,
        today,
      ),
    );

    currentDate =
      addCalendarDays(
        currentDate,
        1,
      );
  }

  return cells;
}

export interface HabitProgressSummary {
  readonly currentStreak: number;

  readonly today: HabitCalendarDay;

  readonly completedToday: boolean;
}

export function createHabitProgressSummary(
  habit: Habit,
  occurrences: readonly HabitOccurrence[],
  categories: readonly HabitCategory[],
  today: HabitDate,
): HabitProgressSummary {
  const todayState =
    createHabitCalendarDay(
      habit,
      occurrences,
      categories,
      today,
      today,
    );

  return {
    currentStreak:
      calculateCurrentStreak(
        habit,
        occurrences,
        today,
      ),

    today:
      todayState,

    completedToday:
      isDateCompletedForHabit(
        habit,
        occurrences,
        today,
      ),
  };
}
import type {
  HabitDate,
} from "../types";

import {
  parseHabitDate,
} from "./habitDates";

export interface CalendarDay {
  readonly date: HabitDate;

  readonly dayOfMonth: number;
  readonly dayOfWeek: number;

  readonly isToday: boolean;
  readonly isSelected: boolean;
  readonly isCurrentMonth: boolean;
}

function toHabitDate(
  date: Date,
): HabitDate {
  return [
    date.getUTCFullYear()
      .toString()
      .padStart(4, "0"),

    (date.getUTCMonth() + 1)
      .toString()
      .padStart(2, "0"),

    date.getUTCDate()
      .toString()
      .padStart(2, "0"),
  ].join("-");
}

function createUTCDate(
  date: HabitDate,
): Date {
  const {
    year,
    month,
    day,
  } = parseHabitDate(date);

  return new Date(
    Date.UTC(
      year,
      month - 1,
      day,
    ),
  );
}

export function addCalendarDays(
  date: HabitDate,
  amount: number,
): HabitDate {
  const result = createUTCDate(date);

  result.setUTCDate(
    result.getUTCDate() + amount,
  );

  return toHabitDate(result);
}

export function getStartOfWeek(
  date: HabitDate,
  firstDayOfWeek: number,
): HabitDate {
  const current = createUTCDate(date);

  const currentDay =
    current.getUTCDay();

  const offset =
    (currentDay -
      firstDayOfWeek +
      7) %
    7;

  current.setUTCDate(
    current.getUTCDate() - offset,
  );

  return toHabitDate(current);
}

export function getWeekDates(
  date: HabitDate,
  firstDayOfWeek: number,
): HabitDate[] {
  const start = getStartOfWeek(
    date,
    firstDayOfWeek,
  );

  return Array.from(
    { length: 7 },
    (_, index) =>
      addCalendarDays(
        start,
        index,
      ),
  );
}

export function getMonthDates(
  year: number,
  month: number,
): HabitDate[] {
  const firstDay = new Date(
    Date.UTC(
      year,
      month - 1,
      1,
    ),
  );

  const daysInMonth =
    new Date(
      Date.UTC(
        year,
        month,
        0,
      ),
    ).getUTCDate();

  return Array.from(
    { length: daysInMonth },
    (_, index) => {
      const date = new Date(
        firstDay,
      );

      date.setUTCDate(
        index + 1,
      );

      return toHabitDate(date);
    },
  );
}

export function getMonthGridDates(
  year: number,
  month: number,
  firstDayOfWeek: number,
): HabitDate[] {
  const firstDate = toHabitDate(
    new Date(
      Date.UTC(
        year,
        month - 1,
        1,
      ),
    ),
  );

  const lastDate = toHabitDate(
    new Date(
      Date.UTC(
        year,
        month,
        0,
      ),
    ),
  );

  const gridStart =
    getStartOfWeek(
      firstDate,
      firstDayOfWeek,
    );

  const lastDay = createUTCDate(
    lastDate,
  );

  const lastDayOfWeek =
    lastDay.getUTCDay();

  const daysUntilEnd =
    (firstDayOfWeek +
      6 -
      lastDayOfWeek +
      7) %
    7;

  const gridEnd =
    addCalendarDays(
      lastDate,
      daysUntilEnd,
    );

  const start =
    createUTCDate(gridStart);

  const end =
    createUTCDate(gridEnd);

  const totalDays =
    Math.round(
      (end.getTime() -
        start.getTime()) /
        86_400_000,
    ) + 1;

  return Array.from(
    { length: totalDays },
    (_, index) =>
      addCalendarDays(
        gridStart,
        index,
      ),
  );
}

export function getPreviousMonth(
  date: HabitDate,
): HabitDate {
  const current =
    createUTCDate(date);

  current.setUTCMonth(
    current.getUTCMonth() - 1,
    1,
  );

  return toHabitDate(current);
}

export function getNextMonth(
  date: HabitDate,
): HabitDate {
  const current =
    createUTCDate(date);

  current.setUTCMonth(
    current.getUTCMonth() + 1,
    1,
  );

  return toHabitDate(current);
}

export function getPreviousWeek(
  date: HabitDate,
): HabitDate {
  return addCalendarDays(
    date,
    -7,
  );
}

export function getNextWeek(
  date: HabitDate,
): HabitDate {
  return addCalendarDays(
    date,
    7,
  );
}

export function getToday(): HabitDate {
  const now = new Date();

  return [
    now.getFullYear()
      .toString()
      .padStart(4, "0"),

    (now.getMonth() + 1)
      .toString()
      .padStart(2, "0"),

    now.getDate()
      .toString()
      .padStart(2, "0"),
  ].join("-");
}

export interface CalendarNavigationState {
  readonly selectedDate: HabitDate;

  readonly visibleStartDate: HabitDate;
  readonly visibleEndDate: HabitDate;
}

export function createCalendarNavigation(
  selectedDate: HabitDate,
  firstDayOfWeek: number,
): CalendarNavigationState {
  const week =
    getWeekDates(
      selectedDate,
      firstDayOfWeek,
    );

  return {
    selectedDate,

    visibleStartDate:
      week[0],

    visibleEndDate:
      week[6],
  };
}

function getDayDifference(
  from: HabitDate,
  to: HabitDate,
): number {
  const start = createUTCDate(from);
  const end = createUTCDate(to);

  return Math.round(
    (end.getTime() - start.getTime()) /
      86_400_000,
  );
}

export function getVisibleDates(
  state: CalendarNavigationState,
): HabitDate[] {
  return getDatesInRange({
    start: state.visibleStartDate,
    end: state.visibleEndDate,
  });
}

export function isDateVisible(
  state: CalendarNavigationState,
  date: HabitDate,
): boolean {
  return (
    date >= state.visibleStartDate &&
    date <= state.visibleEndDate
  );
}

/**
 * Move the selected date by a number of days.
 *
 * The seven-day window only shifts when the selected date
 * would otherwise leave the visible range.
 */
export function moveSelectedDate(
  state: CalendarNavigationState,
  amount: number,
): CalendarNavigationState {
  const selectedDate =
    addCalendarDays(
      state.selectedDate,
      amount,
    );

  if (
    selectedDate >= state.visibleStartDate &&
    selectedDate <= state.visibleEndDate
  ) {
    return {
      ...state,
      selectedDate,
    };
  }

  const overflow =
    selectedDate < state.visibleStartDate
      ? getDayDifference(
          state.visibleStartDate,
          selectedDate,
        )
      : getDayDifference(
          state.visibleEndDate,
          selectedDate,
        );

  return {
    selectedDate,
    visibleStartDate: addCalendarDays(
      state.visibleStartDate,
      overflow,
    ),
    visibleEndDate: addCalendarDays(
      state.visibleEndDate,
      overflow,
    ),
  };
}

export function selectCalendarDate(
  state: CalendarNavigationState,
  date: HabitDate,
  firstDayOfWeek: number,
): CalendarNavigationState {
  if (isDateVisible(state, date)) {
    return {
      ...state,
      selectedDate: date,
    };
  }

  return createCalendarNavigation(
    date,
    firstDayOfWeek,
  );
}

export function goToToday(
  firstDayOfWeek: number,
): CalendarNavigationState {
  return createCalendarNavigation(
    getToday(),
    firstDayOfWeek,
  );
}

export interface DateRange {
  readonly start: HabitDate;
  readonly end: HabitDate;
}

export function createDateRange(
  start: HabitDate,
  end: HabitDate,
): DateRange {
  if (start > end) {
    throw new Error(
      "Date range start cannot be after end.",
    );
  }

  return {
    start,
    end,
  };
}

export function getDatesInRange(
  range: DateRange,
): HabitDate[] {
  const start =
    createUTCDate(range.start);

  const end =
    createUTCDate(range.end);

  const totalDays =
    Math.round(
      (end.getTime() -
        start.getTime()) /
        86_400_000,
    ) + 1;

  return Array.from(
    { length: totalDays },
    (_, index) =>
      addCalendarDays(
        range.start,
        index,
      ),
  );
}
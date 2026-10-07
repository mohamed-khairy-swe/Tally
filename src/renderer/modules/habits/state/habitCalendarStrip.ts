import type { HabitDate } from "../types";

import {
  addCalendarDays,
  getVisibleDates,
  type CalendarNavigationState,
} from "./habitCalendar";
import { parseHabitDate } from "./habitDates";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export interface CalendarStripDay {
  readonly date: HabitDate;
  readonly weekday: number;
  readonly dayNumber: number;
  readonly label: string;
  readonly isToday: boolean;
  readonly isSelected: boolean;
}

export function formatHabitDateLabel(
  date: HabitDate,
  today: HabitDate,
): string {
  if (date === today) {
    return "Today";
  }

  if (date === addCalendarDays(today, -1)) {
    return "Yesterday";
  }

  if (date === addCalendarDays(today, 1)) {
    return "Tomorrow";
  }

  const { year, month, day } = parseHabitDate(date);

  return `${day} ${MONTH_LABELS[month - 1]} ${year}`;
}

export function createCalendarStripDays(
  state: CalendarNavigationState,
  today: HabitDate,
): CalendarStripDay[] {
  return getVisibleDates(state).map((date) => {
    const { day } = parseHabitDate(date);
    const parsed = new Date(`${date}T00:00:00Z`);

    return {
      date,
      weekday: parsed.getUTCDay(),
      dayNumber: day,
      label: formatHabitDateLabel(date, today),
      isToday: date === today,
      isSelected: date === state.selectedDate,
    };
  });
}

export function formatSelectedDateHeading(
  date: HabitDate,
): string {
  const { year, month, day } = parseHabitDate(date);
  const weekday = new Date(`${date}T00:00:00Z`).toLocaleDateString(
    "en-GB",
    { weekday: "long", timeZone: "UTC" },
  );

  return `${weekday}, ${day} ${MONTH_LABELS[month - 1]} ${year}`;
}

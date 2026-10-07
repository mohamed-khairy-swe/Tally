import type { HabitSchedule } from "../types";

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const WEEKDAY_SHORT_NAMES = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

function ordinal(day: number): string {
  const remainder = day % 100;

  if (remainder >= 11 && remainder <= 13) {
    return `${day}th`;
  }

  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

function joinList(items: readonly string[]): string {
  if (items.length === 0) {
    return "";
  }

  if (items.length === 1) {
    return items[0];
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

export function getOrderedWeekdays(
  firstDayOfWeek: number,
): number[] {
  return Array.from(
    { length: 7 },
    (_, index) => (firstDayOfWeek + index) % 7,
  );
}

export function getWeekdayShortName(weekday: number): string {
  return WEEKDAY_SHORT_NAMES[weekday] ?? "";
}

export function describeSchedule(
  schedule: HabitSchedule,
  firstDayOfWeek = 1,
): string {
  if (schedule.type === "daily") {
    return "Every day";
  }

  if (schedule.type === "weekly") {
    if (schedule.weekdays.length === 7) {
      return "Every day";
    }

    if (schedule.weekdays.length === 1) {
      return `Every ${WEEKDAY_NAMES[schedule.weekdays[0]]}`;
    }

    const ordered = getOrderedWeekdays(firstDayOfWeek)
      .filter((weekday) => schedule.weekdays.includes(weekday))
      .map((weekday) => WEEKDAY_NAMES[weekday]);

    return `Every ${joinList(ordered)}`;
  }

  const days = [...schedule.monthDays].sort((a, b) => a - b);

  if (days.length === 1) {
    return `Every ${ordinal(days[0])} of the month`;
  }

  return `Every ${joinList(days.map(ordinal))} of the month`;
}

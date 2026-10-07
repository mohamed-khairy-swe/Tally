import type { HabitDate } from "../types";

const HABIT_DATE_PATTERN =
  /^\d{4}-\d{2}-\d{2}$/;

export function isValidHabitDate(
  date: HabitDate,
): boolean {
  if (!HABIT_DATE_PATTERN.test(date)) {
    return false;
  }

  const [year, month, day] = date
    .split("-")
    .map(Number);

  const parsedDate = new Date(
    Date.UTC(year, month - 1, day),
  );

  return (
    parsedDate.getUTCFullYear() === year &&
    parsedDate.getUTCMonth() === month - 1 &&
    parsedDate.getUTCDate() === day
  );
}


export function getWeekday(
  date: HabitDate,
): number {
  if (!isValidHabitDate(date)) {
    throw new Error(
      `Invalid habit date: ${date}`,
    );
  }

  const [year, month, day] = date
    .split("-")
    .map(Number);

  return new Date(
    Date.UTC(year, month - 1, day),
  ).getUTCDay();
}

export function getDaysInMonth(
  year: number,
  month: number,
): number {
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    throw new Error(
      "Invalid year or month.",
    );
  }

  return new Date(
    Date.UTC(year, month, 0),
  ).getUTCDate();
}

export function parseHabitDate(
  date: HabitDate,
): {
  year: number;
  month: number;
  day: number;
} {
  if (!isValidHabitDate(date)) {
    throw new Error(
      `Invalid habit date: ${date}`,
    );
  }

  const [year, month, day] = date
    .split("-")
    .map(Number);

  return {
    year,
    month,
    day,
  };
}
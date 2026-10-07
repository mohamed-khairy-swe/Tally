import { useEffect, useState } from "react";

import {
  getMonthGridDates,
  getNextMonth,
  getPreviousMonth,
} from "../state/habitCalendar";
import { parseHabitDate } from "../state/habitDates";
import { getWeekdayShortName, getOrderedWeekdays } from "../state/habitScheduleSummary";
import type { HabitDate } from "../types";
import "./MonthDatePicker.css";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

interface MonthDatePickerProps {
  readonly selectedDate: HabitDate;
  readonly today: HabitDate;
  readonly firstDayOfWeek: number;
  readonly onSelect: (date: HabitDate) => void;
  readonly onClose: () => void;
}

export function MonthDatePicker({
  selectedDate,
  today,
  firstDayOfWeek,
  onSelect,
  onClose,
}: MonthDatePickerProps) {
  const initial = parseHabitDate(selectedDate);
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);

  const grid = getMonthGridDates(year, month, firstDayOfWeek);
  const weekdays = getOrderedWeekdays(firstDayOfWeek);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function moveMonth(direction: -1 | 1) {
    const current = `${year}-${String(month).padStart(2, "0")}-01`;
    const next = parseHabitDate(
      direction === -1 ? getPreviousMonth(current) : getNextMonth(current),
    );
    setYear(next.year);
    setMonth(next.month);
  }

  return (
    <div
      className="habit-date-picker-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        className="habit-date-picker"
        role="dialog"
        aria-label="Jump to date"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="habit-date-picker__header">
          <button type="button" onClick={() => moveMonth(-1)} aria-label="Previous month">
            ‹
          </button>
          <strong>
            {MONTH_NAMES[month - 1]} {year}
          </strong>
          <button type="button" onClick={() => moveMonth(1)} aria-label="Next month">
            ›
          </button>
        </div>

        <div className="habit-date-picker__weekdays">
          {weekdays.map((weekday) => (
            <span key={weekday}>{getWeekdayShortName(weekday)}</span>
          ))}
        </div>

        <div className="habit-date-picker__grid">
          {grid.map((date) => {
            const parsed = parseHabitDate(date);
            const isCurrentMonth = parsed.month === month;

            return (
              <button
                key={date}
                type="button"
                className={[
                  "habit-date-picker__day",
                  date === selectedDate ? "habit-date-picker__day--selected" : "",
                  date === today ? "habit-date-picker__day--today" : "",
                  isCurrentMonth ? "" : "habit-date-picker__day--outside",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => {
                  onSelect(date);
                  onClose();
                }}
              >
                {parsed.day}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

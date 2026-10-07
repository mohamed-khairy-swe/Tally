import React, { useRef } from "react";
import type { CalendarStripDay } from "../state/habitCalendarStrip";
import { getWeekdayShortName } from "../state/habitScheduleSummary";
import type { HabitDate } from "../types";
import "./HorizontalCalendar.css";

interface HorizontalCalendarProps {
  readonly days: readonly CalendarStripDay[];
  readonly selectedDate: HabitDate;
  readonly today: HabitDate;
  readonly onDateSelect: (date: HabitDate) => void;
  readonly onPrevious: () => void;
  readonly onNext: () => void;
}

export function HorizontalCalendar({
  days,
  selectedDate,
  today,
  onDateSelect,
  onPrevious,
  onNext,
}: HorizontalCalendarProps) {
  const lastWheelStepAt = useRef(0);

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    // Debounce trackpad/mousewheel high-resolution scroll
    const now = Date.now();
    if (now - lastWheelStepAt.current < 200) {
      return;
    }

    if (Math.abs(event.deltaY) < 6 && Math.abs(event.deltaX) < 6) {
      return;
    }

    lastWheelStepAt.current = now;

    const delta =
      Math.abs(event.deltaY) >= Math.abs(event.deltaX)
        ? event.deltaY
        : event.deltaX;

    if (delta > 0) {
      onNext();
    } else {
      onPrevious();
    }
  }

  return (
    <section
      className="habit-calendar"
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          onPrevious();
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          onNext();
        }
      }}
      tabIndex={0}
      aria-label="Habit calendar date navigation"
    >
      <div className="habit-calendar__strip-row">
        <button
          type="button"
          className="habit-calendar__nav-btn"
          onClick={onPrevious}
          aria-label="Previous day"
          title="Previous day (Left arrow)"
        >
          ‹
        </button>

        <div
          className="habit-calendar__viewport"
          onWheel={handleWheel}
        >
          <div className="habit-calendar__days" role="list">
            {days.map((day) => {
              const isSelected = day.date === selectedDate;
              const isToday = day.date === today;

              return (
                <button
                  key={day.date}
                  type="button"
                  role="listitem"
                  className={[
                    "habit-calendar__day",
                    isSelected ? "habit-calendar__day--selected" : "",
                    isToday ? "habit-calendar__day--today" : "",
                    isSelected && isToday ? "habit-calendar__day--selected-today" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => onDateSelect(day.date)}
                  aria-label={`${getWeekdayShortName(day.weekday)} ${day.dayNumber}, ${day.label}`}
                  aria-current={isToday ? "date" : undefined}
                  aria-pressed={isSelected}
                >
                  <span className="habit-calendar__weekday">
                    {getWeekdayShortName(day.weekday)}
                  </span>
                  <span className="habit-calendar__date">{day.dayNumber}</span>
                  <span className="habit-calendar__label">{day.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          className="habit-calendar__nav-btn"
          onClick={onNext}
          aria-label="Next day"
          title="Next day (Right arrow)"
        >
          ›
        </button>
      </div>
    </section>
  );
}

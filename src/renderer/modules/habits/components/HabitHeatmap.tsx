import React, { useMemo, useState } from "react";
import type {
  Habit,
  HabitCategory,
  HabitDate,
  HabitOccurrence,
} from "../types";
import {
  addCalendarDays,
  getStartOfWeek,
} from "../state/habitCalendar";
import { parseHabitDate } from "../state/habitDates";
import {
  getOrderedWeekdays,
  getWeekdayShortName,
} from "../state/habitScheduleSummary";
import {
  createHabitCalendarDay,
  type HabitCalendarDay,
} from "../state/habitCalendarViewModel";
import "./HabitHeatmap.css";

interface HabitHeatmapProps {
  readonly habit: Habit;
  readonly occurrences: readonly HabitOccurrence[];
  readonly categories: readonly HabitCategory[];
  readonly today: HabitDate;
  readonly firstDayOfWeek: number;
}

interface HeatmapDayInfo {
  readonly date: HabitDate;
  readonly dayData: HabitCalendarDay;
  readonly isFuture: boolean;
  readonly isBeforeStart: boolean;
}

const MONTH_SHORT_NAMES = [
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

export function HabitHeatmap({
  habit,
  occurrences,
  categories,
  today,
  firstDayOfWeek,
}: HabitHeatmapProps) {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    text: string;
    subText?: string;
  } | null>(null);

  // Generate 53 weeks ending with the week containing today
  const { weeks, monthHeaders, orderedWeekdays } = useMemo(() => {
    const currentWeekStart = getStartOfWeek(today, firstDayOfWeek);
    // 52 weeks before current week = 53 weeks total
    const gridStart = addCalendarDays(currentWeekStart, -52 * 7);

    const generatedWeeks: HeatmapDayInfo[][] = [];
    const months: Array<{ label: string; weekIndex: number }> = [];
    let lastSeenMonth = -1;

    for (let w = 0; w < 53; w++) {
      const weekDays: HeatmapDayInfo[] = [];
      const weekStartDate = addCalendarDays(gridStart, w * 7);

      // Check month header
      const { month } = parseHabitDate(weekStartDate);
      if (month !== lastSeenMonth) {
        months.push({
          label: MONTH_SHORT_NAMES[month - 1],
          weekIndex: w,
        });
        lastSeenMonth = month;
      }

      for (let d = 0; d < 7; d++) {
        const date = addCalendarDays(weekStartDate, d);
        const dayData = createHabitCalendarDay(
          habit,
          occurrences,
          categories,
          date,
          today,
        );

        weekDays.push({
          date,
          dayData,
          isFuture: date > today,
          isBeforeStart: date < habit.startDate,
        });
      }

      generatedWeeks.push(weekDays);
    }

    return {
      weeks: generatedWeeks,
      monthHeaders: months,
      orderedWeekdays: getOrderedWeekdays(firstDayOfWeek),
    };
  }, [habit, occurrences, categories, today, firstDayOfWeek]);

  // Check if current habit configuration or history has any progressive type
  const isProgressive = useMemo(() => {
    return habit.configurations.some((c) => c.trackingType === "progressive");
  }, [habit]);

  function getTooltipContent(day: HeatmapDayInfo): {
    title: string;
    description: string;
  } {
    const { year, month, day: dayNum } = parseHabitDate(day.date);
    const dateFormatted = `${dayNum} ${MONTH_SHORT_NAMES[month - 1]} ${year}`;

    if (day.isFuture) {
      return {
        title: dateFormatted,
        description: "Future date",
      };
    }

    if (day.isBeforeStart) {
      return {
        title: dateFormatted,
        description: "Before habit started",
      };
    }

    if (!day.dayData.scheduled) {
      return {
        title: dateFormatted,
        description: "Not scheduled",
      };
    }

    const { state, progress, target, unit } = day.dayData;
    const unitStr = unit ? ` ${unit}` : "";

    if (state === "completed") {
      if (target !== null && progress !== null) {
        return {
          title: dateFormatted,
          description: `Completed · ${progress} / ${target}${unitStr}`,
        };
      }
      return {
        title: dateFormatted,
        description: "Completed",
      };
    }

    if (state === "partial") {
      return {
        title: dateFormatted,
        description: `Partial · ${progress ?? 0} / ${target ?? 0}${unitStr}`,
      };
    }

    // Incomplete
    if (day.date === today) {
      return {
        title: dateFormatted,
        description: "Due today",
      };
    }

    return {
      title: dateFormatted,
      description: "Missed",
    };
  }

  function handleMouseEnter(
    event: React.MouseEvent<HTMLDivElement>,
    day: HeatmapDayInfo,
  ) {
    const rect = event.currentTarget.getBoundingClientRect();
    const info = getTooltipContent(day);
    setTooltip({
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
      text: info.title,
      subText: info.description,
    });
  }

  function handleMouseLeave() {
    setTooltip(null);
  }

  return (
    <div className="habit-heatmap-wrapper">
      <div className="habit-heatmap">
        {/* Month labels header */}
        <div className="habit-heatmap__months">
          <div className="habit-heatmap__months-spacer" />
          <div className="habit-heatmap__months-track">
            {monthHeaders.map((m, idx) => (
              <span
                key={`${m.label}-${m.weekIndex}-${idx}`}
                className="habit-heatmap__month-label"
                style={{
                  gridColumnStart: m.weekIndex + 1,
                }}
              >
                {m.label}
              </span>
            ))}
          </div>
        </div>

        {/* Heatmap main grid with weekday sidebar */}
        <div className="habit-heatmap__body">
          {/* Weekday labels */}
          <div className="habit-heatmap__weekdays">
            {orderedWeekdays.map((weekday, idx) => (
              <span
                key={weekday}
                className="habit-heatmap__weekday-label"
                // Only show alternating labels to prevent visual clutter
                style={{ opacity: idx % 2 === 1 ? 1 : 0 }}
              >
                {getWeekdayShortName(weekday)}
              </span>
            ))}
          </div>

          {/* 53 week columns */}
          <div className="habit-heatmap__grid">
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="habit-heatmap__week-col">
                {week.map((day) => {
                  let cellClass = "habit-heatmap__cell";
                  let style: React.CSSProperties = {};

                  if (day.isFuture) {
                    cellClass += " habit-heatmap__cell--future";
                  } else if (day.isBeforeStart) {
                    cellClass += " habit-heatmap__cell--before-start";
                  } else if (!day.dayData.scheduled) {
                    cellClass += " habit-heatmap__cell--not-scheduled";
                  } else if (day.dayData.state === "completed") {
                    cellClass += " habit-heatmap__cell--completed";
                    style.backgroundColor = habit.completedColor;
                  } else if (day.dayData.state === "partial") {
                    cellClass += " habit-heatmap__cell--partial";
                    style.backgroundColor = habit.partialColor;
                  } else {
                    // Scheduled but not completed
                    cellClass +=
                      day.date === today
                        ? " habit-heatmap__cell--today-due"
                        : " habit-heatmap__cell--missed";
                  }

                  if (day.date === today) {
                    cellClass += " habit-heatmap__cell--today";
                  }

                  return (
                    <div
                      key={day.date}
                      className={cellClass}
                      style={style}
                      onMouseEnter={(e) => handleMouseEnter(e, day)}
                      onMouseLeave={handleMouseLeave}
                      role="img"
                      aria-label={`${day.date}: ${getTooltipContent(day).description}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="habit-heatmap__legend">
          <span className="habit-heatmap__legend-text">Less</span>
          <span className="habit-heatmap__legend-cell habit-heatmap__cell--not-scheduled" title="Not scheduled" />
          <span className="habit-heatmap__legend-cell habit-heatmap__cell--missed" title="Missed" />
          {isProgressive && (
            <span
              className="habit-heatmap__legend-cell habit-heatmap__cell--partial"
              style={{ backgroundColor: habit.partialColor }}
              title="Partial progress"
            />
          )}
          <span
            className="habit-heatmap__legend-cell habit-heatmap__cell--completed"
            style={{ backgroundColor: habit.completedColor }}
            title="Completed"
          />
          <span className="habit-heatmap__legend-text">More</span>

          <div className="habit-heatmap__legend-labels">
            <span className="habit-heatmap__legend-item">
              <span
                className="habit-heatmap__legend-swatch"
                style={{ backgroundColor: habit.completedColor }}
              />
              Completed
            </span>
            {isProgressive && (
              <span className="habit-heatmap__legend-item">
                <span
                  className="habit-heatmap__legend-swatch"
                  style={{ backgroundColor: habit.partialColor }}
                />
                Partial
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Hover Tooltip */}
      {tooltip && (
        <div
          className="habit-heatmap-tooltip"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
          }}
        >
          <div className="habit-heatmap-tooltip__title">{tooltip.text}</div>
          {tooltip.subText && (
            <div className="habit-heatmap-tooltip__desc">
              {tooltip.subText}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

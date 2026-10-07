import React from "react";
import type {
  Habit,
  HabitCategory,
  HabitConfiguration,
  HabitDate,
  HabitOccurrence,
} from "../types";
import "./HabitCard.css";

interface HabitCardProps {
  readonly habit: Habit;
  readonly configuration: HabitConfiguration;
  readonly occurrence: HabitOccurrence | null;
  readonly category: HabitCategory | null;
  readonly streak: number;
  readonly date: HabitDate;
  readonly today: HabitDate;
  readonly onToggleBinary: () => void;
  readonly onIncrement: () => void;
  readonly onDecrement: () => void;
  readonly onReset: () => void;
  readonly onClickDetails: () => void;
}

export function HabitCard({
  habit,
  configuration,
  occurrence,
  category,
  streak,
  date,
  today,
  onToggleBinary,
  onIncrement,
  onDecrement,
  onReset,
  onClickDetails,
}: HabitCardProps) {
  const isToday = date === today;
  const isPast = date < today;
  const isFuture = date > today;

  const isBinary = configuration.trackingType === "binary";
  const progress = occurrence?.progress ?? 0;
  const target = configuration.target ?? 1;
  const increment = configuration.increment ?? 1;
  const unit = configuration.unit ? ` ${configuration.unit}` : "";

  const isCompleted = isBinary ? progress >= 1 : progress >= target;
  const isPartial = !isBinary && progress > 0 && progress < target;

  const percentage = isBinary
    ? isCompleted
      ? 100
      : 0
    : Math.min(100, Math.round((progress / target) * 100));

  // Determine active status label
  let statusLabel: string | null = null;
  if (isCompleted) {
    statusLabel = "Completed";
  } else if (isFuture) {
    statusLabel = "Upcoming";
  } else if (isPast) {
    statusLabel = isPartial ? `Partial · ${progress}/${target}${unit}` : "Overdue";
  } else {
    // Today
    statusLabel = isPartial ? "In Progress" : "Due";
  }

  function handleActionClick(event: React.MouseEvent, action: () => void) {
    event.stopPropagation();
    action();
  }

  return (
    <article
      className={`habit-card ${isCompleted ? "habit-card--completed" : ""} ${
        isPast ? "habit-card--past" : ""
      } ${isFuture ? "habit-card--future" : ""}`}
      onClick={onClickDetails}
      tabIndex={0}
      role="button"
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          onClickDetails();
        }
      }}
      aria-label={`${habit.name}, status: ${statusLabel}, streak: ${streak}`}
    >
      <div className="habit-card__primary-action">
        {isBinary ? (
          <button
            type="button"
            className={`habit-card__check-btn ${
              isCompleted ? "habit-card__check-btn--checked" : ""
            }`}
            style={
              isCompleted
                ? { backgroundColor: habit.completedColor, borderColor: habit.completedColor }
                : undefined
            }
            onClick={(e) => handleActionClick(e, onToggleBinary)}
            disabled={!isToday}
            aria-label={
              isCompleted
                ? isToday
                  ? "Mark incomplete"
                  : "Completed"
                : isToday
                ? "Mark completed"
                : statusLabel ?? "Not completed"
            }
            title={
              isFuture
                ? "Future occurrence — change schedule from Edit Habit"
                : isPast
                ? "Past occurrences are read-only"
                : undefined
            }
          >
            {isCompleted ? "✓" : ""}
          </button>
        ) : (
          <div className="habit-card__progressive-controls">
            <button
              type="button"
              className={`habit-card__increment-btn ${
                isCompleted ? "habit-card__increment-btn--completed" : ""
              }`}
              style={
                isCompleted
                  ? { backgroundColor: habit.completedColor, borderColor: habit.completedColor }
                  : undefined
              }
              onClick={(e) => handleActionClick(e, onIncrement)}
              disabled={!isToday || isCompleted}
              aria-label={
                isCompleted
                  ? "Completed"
                  : `Add ${increment}${unit}`
              }
              title={
                isFuture
                  ? "Future occurrence — change schedule from Edit Habit"
                  : isPast
                  ? "Past occurrences are read-only"
                  : isCompleted
                  ? "Goal completed"
                  : `+${increment}${unit}`
              }
            >
              {isCompleted ? "✓" : `+${increment}`}
            </button>

            {isToday && !isCompleted && progress > 0 && (
              <button
                type="button"
                className="habit-card__decrement-btn"
                onClick={(e) => handleActionClick(e, onDecrement)}
                aria-label={`Subtract ${increment}${unit}`}
                title={`-${increment}${unit}`}
              >
                -{increment}
              </button>
            )}

            {isToday && !isCompleted && progress > 0 && (
              <button
                type="button"
                className="habit-card__reset-btn"
                onClick={(e) => handleActionClick(e, onReset)}
                aria-label="Reset progress to 0"
                title="Reset to 0"
              >
                ↺
              </button>
            )}
          </div>
        )}
      </div>

      <div className="habit-card__content">
        <div className="habit-card__header-row">
          <span className="habit-card__title" title={habit.name}>
            {habit.name}
          </span>
          {category && (
            <span className="habit-card__category" title={category.name}>
              {category.name}
            </span>
          )}
        </div>

        <div className="habit-card__meta-row">
          {!isBinary && (
            <div className="habit-card__progress-container">
              <div className="habit-card__progress-bar-bg">
                <div
                  className="habit-card__progress-bar-fill"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: isCompleted
                      ? habit.completedColor
                      : habit.partialColor,
                  }}
                />
              </div>
              <span className="habit-card__progress-text">
                {progress} / {target}
                {unit}
              </span>
            </div>
          )}

          {statusLabel && (
            <span
              className={`habit-card__status-badge habit-card__status-badge--${
                isCompleted
                  ? "completed"
                  : isPartial
                  ? "partial"
                  : isPast
                  ? "overdue"
                  : isFuture
                  ? "upcoming"
                  : "due"
              }`}
            >
              {statusLabel}
            </span>
          )}
        </div>
      </div>

      <div className="habit-card__aside">
        <span
          className="habit-card__streak"
          title={`Current streak: ${streak} ${
            configuration.schedule.type === "daily" ? "days" : "occurrences"
          }`}
          aria-label={`Streak: ${streak}`}
        >
          🔥 {streak}
        </span>
      </div>
    </article>
  );
}

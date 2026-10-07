import React from "react";
import type {
  Habit,
  HabitCategory,
  HabitDate,
  HabitOccurrence,
} from "../types";
import { calculateCurrentStreak } from "../state/habitStreaks";
import { describeSchedule } from "../state/habitScheduleSummary";
import { HabitHeatmap } from "./HabitHeatmap";
import "./HabitDetailsView.css";

interface HabitDetailsViewProps {
  readonly habit: Habit;
  readonly occurrences: readonly HabitOccurrence[];
  readonly categories: readonly HabitCategory[];
  readonly today: HabitDate;
  readonly firstDayOfWeek: number;
  readonly onBack: () => void;
  readonly onEdit: () => void;
  readonly onArchive: () => void;
  readonly onRestore: () => void;
}

export function HabitDetailsView({
  habit,
  occurrences,
  categories,
  today,
  firstDayOfWeek,
  onBack,
  onEdit,
  onArchive,
  onRestore,
}: HabitDetailsViewProps) {
  const currentStreak = calculateCurrentStreak(habit, occurrences, today);
  const category = categories.find((c) => c.id === habit.categoryId) ?? null;

  // Most recent configuration
  const latestConfig =
    habit.configurations[habit.configurations.length - 1];

  const scheduleText = latestConfig
    ? describeSchedule(latestConfig.schedule, firstDayOfWeek)
    : "Not scheduled";

  const isProgressive = latestConfig?.trackingType === "progressive";
  const streakUnit =
    latestConfig?.schedule.type === "daily" ? "days" : "occurrences";

  return (
    <section className="habit-details-view" aria-label={`Details for ${habit.name}`}>
      {/* Back button & top actions */}
      <div className="habit-details-view__header">
        <button
          type="button"
          className="habit-details-view__back-btn"
          onClick={onBack}
        >
          ← Back
        </button>

        <div className="habit-details-view__actions">
          <button
            type="button"
            className="habit-details-view__edit-btn"
            onClick={onEdit}
          >
            Edit Habit
          </button>
          {habit.archived ? (
            <button
              type="button"
              className="habit-details-view__restore-btn"
              onClick={onRestore}
            >
              Restore Habit
            </button>
          ) : (
            <button
              type="button"
              className="habit-details-view__archive-btn"
              onClick={onArchive}
            >
              Archive
            </button>
          )}
        </div>
      </div>

      {/* Habit Title & Category */}
      <div className="habit-details-view__title-section">
        <div className="habit-details-view__title-row">
          <h1 className="habit-details-view__title">{habit.name}</h1>
          {category && (
            <span className="habit-details-view__category-pill">
              {category.name}
            </span>
          )}
          {habit.archived && (
            <span className="habit-details-view__archived-badge">
              Archived
            </span>
          )}
        </div>

        {/* Current streak card */}
        <div className="habit-details-view__streak-badge">
          🔥 Current streak: <strong>{currentStreak} {streakUnit}</strong>
        </div>
      </div>

      {/* Heatmap Section */}
      <div className="habit-details-view__section">
        <h2 className="habit-details-view__section-title">Heatmap</h2>
        <HabitHeatmap
          habit={habit}
          occurrences={occurrences}
          categories={categories}
          today={today}
          firstDayOfWeek={firstDayOfWeek}
        />
      </div>

      {/* Overview Info Cards */}
      <div className="habit-details-view__grid">
        <div className="habit-details-view__info-card">
          <h3 className="habit-details-view__info-label">Schedule</h3>
          <p className="habit-details-view__info-value">{scheduleText}</p>
        </div>

        <div className="habit-details-view__info-card">
          <h3 className="habit-details-view__info-label">Tracking Type</h3>
          <p className="habit-details-view__info-value">
            {isProgressive ? "Progressive" : "Binary (Done / Not done)"}
          </p>
          {isProgressive && latestConfig && (
            <p className="habit-details-view__info-sub">
              Target: {latestConfig.target}
              {latestConfig.unit ? ` ${latestConfig.unit}` : ""} · Per press:{" "}
              {latestConfig.increment}
              {latestConfig.unit ? ` ${latestConfig.unit}` : ""}
            </p>
          )}
        </div>

        <div className="habit-details-view__info-card">
          <h3 className="habit-details-view__info-label">Start Date</h3>
          <p className="habit-details-view__info-value">{habit.startDate}</p>
        </div>

        <div className="habit-details-view__info-card">
          <h3 className="habit-details-view__info-label">Colors</h3>
          <div className="habit-details-view__colors-row">
            <div className="habit-details-view__color-preview">
              <span
                className="habit-details-view__color-dot"
                style={{ backgroundColor: habit.completedColor }}
              />
              <span>Completed ({habit.completedColor})</span>
            </div>
            {isProgressive && (
              <div className="habit-details-view__color-preview">
                <span
                  className="habit-details-view__color-dot"
                  style={{ backgroundColor: habit.partialColor }}
                />
                <span>Partial ({habit.partialColor})</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

import React, { useMemo, useState } from "react";
import type {
  Habit,
  HabitCategory,
  HabitConfiguration,
  HabitDate,
  HabitSchedule,
  HabitSettings,
  HabitTrackingType,
} from "../types";
import { addCalendarDays } from "../state/habitCalendar";
import {
  describeSchedule,
  getOrderedWeekdays,
  getWeekdayShortName,
} from "../state/habitScheduleSummary";
import { createHabitConfiguration } from "../state/habitValidation";
import { addHabitConfiguration, createHabit } from "../state/habitConfiguration";
import { createCategory } from "../state/habitCategories";
import { ConfirmModal } from "./ConfirmModal";
import "./HabitFormDialog.css";

interface HabitFormDialogProps {
  readonly habitToEdit?: Habit | null;
  readonly categories: readonly HabitCategory[];
  readonly today: HabitDate;
  readonly settings: HabitSettings;
  readonly onSave: (savedHabit: Habit, updatedCategories?: HabitCategory[]) => void;
  readonly onCancel: () => void;
}

const PRESET_COLORS = [
  "#386a20", // forest green
  "#2e6b56", // teal green
  "#1967d2", // blue
  "#6750a4", // purple
  "#984061", // berry
  "#b3261e", // red
  "#c47c16", // amber / orange
  "#795548", // brown
  "#455a64", // slate
] as const;

export function HabitFormDialog({
  habitToEdit,
  categories,
  today,
  settings,
  onSave,
  onCancel,
}: HabitFormDialogProps) {
  const isEditing = Boolean(habitToEdit);

  // Active or latest configuration if editing
  const existingLatestConfig = habitToEdit
    ? habitToEdit.configurations[habitToEdit.configurations.length - 1]
    : null;

  // Form State
  const [name, setName] = useState(habitToEdit?.name ?? "");
  const [categoryId, setCategoryId] = useState<string | null>(
    habitToEdit?.categoryId ?? null,
  );
  const [trackingType, setTrackingType] = useState<HabitTrackingType>(
    existingLatestConfig?.trackingType ?? "binary",
  );
  const [targetStr, setTargetStr] = useState<string>(
    existingLatestConfig?.target?.toString() ?? "30",
  );
  const [incrementStr, setIncrementStr] = useState<string>(
    existingLatestConfig?.increment?.toString() ?? "5",
  );
  const [unit, setUnit] = useState<string>(existingLatestConfig?.unit ?? "");

  // Schedule state
  const [scheduleType, setScheduleType] = useState<HabitSchedule["type"]>(
    existingLatestConfig?.schedule.type ?? "daily",
  );
  const [weekdays, setWeekdays] = useState<number[]>(
    existingLatestConfig?.schedule.weekdays
      ? [...existingLatestConfig.schedule.weekdays]
      : [1, 2, 3, 4, 5],
  );
  const [monthDays, setMonthDays] = useState<number[]>(
    existingLatestConfig?.schedule.monthDays
      ? [...existingLatestConfig.schedule.monthDays]
      : [1, 15],
  );

  const [startDate, setStartDate] = useState<HabitDate>(
    habitToEdit?.startDate ?? today,
  );
  const [completedColor, setCompletedColor] = useState<string>(
    habitToEdit?.completedColor ?? settings.defaultCompletedColor,
  );
  const [partialColor, setPartialColor] = useState<string>(
    habitToEdit?.partialColor ?? settings.defaultPartialColor,
  );

  // Inline Category Creation state
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Unsaved changes confirmation
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Validation
  const target = parseInt(targetStr, 10);
  const increment = parseInt(incrementStr, 10);

  const validationErrors = useMemo(() => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = "Habit name is required.";
    } else if (name.trim().length > 80) {
      errors.name = "Name must be 80 characters or less.";
    }

    if (trackingType === "progressive") {
      if (isNaN(target) || target <= 0) {
        errors.target = "Target must be a positive number.";
      }
      if (isNaN(increment) || increment <= 0) {
        errors.increment = "Increment must be a positive number.";
      }
      if (!isNaN(target) && !isNaN(increment) && target > 0 && increment > 0) {
        if (increment > target) {
          errors.increment = "Increment cannot be greater than target.";
        } else if (target % increment !== 0) {
          errors.increment = `Target (${target}) must be evenly divisible by increment (${increment}).`;
        }
      }
    }

    if (scheduleType === "weekly" && weekdays.length === 0) {
      errors.schedule = "Select at least one weekday.";
    }

    if (scheduleType === "monthly" && monthDays.length === 0) {
      errors.schedule = "Select at least one day of the month.";
    }

    return errors;
  }, [name, trackingType, target, increment, scheduleType, weekdays, monthDays]);

  const isValid = Object.keys(validationErrors).length === 0;

  // Normalized schedule for preview
  const currentSchedule: HabitSchedule = useMemo(() => {
    if (scheduleType === "daily") {
      return { type: "daily", weekdays: [], monthDays: [] };
    }
    if (scheduleType === "weekly") {
      if (weekdays.length === 7) {
        return { type: "daily", weekdays: [], monthDays: [] };
      }
      return { type: "weekly", weekdays, monthDays: [] };
    }
    return { type: "monthly", weekdays: [], monthDays };
  }, [scheduleType, weekdays, monthDays]);

  const scheduleSummary = useMemo(() => {
    return describeSchedule(currentSchedule, settings.firstDayOfWeek);
  }, [currentSchedule, settings.firstDayOfWeek]);

  // Track whether form has been modified
  const isDirty = useMemo(() => {
    if (!habitToEdit) {
      return Boolean(name.trim());
    }
    return (
      name !== habitToEdit.name ||
      categoryId !== habitToEdit.categoryId ||
      trackingType !== existingLatestConfig?.trackingType ||
      completedColor !== habitToEdit.completedColor ||
      partialColor !== habitToEdit.partialColor ||
      scheduleType !== existingLatestConfig?.schedule.type ||
      targetStr !== (existingLatestConfig?.target?.toString() ?? "30") ||
      incrementStr !== (existingLatestConfig?.increment?.toString() ?? "5") ||
      unit !== (existingLatestConfig?.unit ?? "")
    );
  }, [
    habitToEdit,
    name,
    categoryId,
    trackingType,
    completedColor,
    partialColor,
    scheduleType,
    targetStr,
    incrementStr,
    unit,
    existingLatestConfig,
  ]);

  function handleAttemptClose() {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      onCancel();
    }
  }

  function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!isValid) return;

    if (!habitToEdit) {
      // CREATE
      const config = createHabitConfiguration({
        effectiveFrom: startDate,
        trackingType,
        schedule: currentSchedule,
        target: trackingType === "progressive" ? target : undefined,
        increment: trackingType === "progressive" ? increment : undefined,
        unit: trackingType === "progressive" ? unit.trim() : undefined,
      });

      const res = createHabit({
        name: name.trim(),
        categoryId,
        startDate,
        completedColor,
        partialColor,
        configuration: config,
      });

      if (res.habit) {
        onSave(res.habit);
      }
    } else {
      // EDIT
      // Check if recurring configuration changed
      const tomorrow = addCalendarDays(today, 1);
      const isScheduleChanged =
        currentSchedule.type !== existingLatestConfig?.schedule.type ||
        JSON.stringify(currentSchedule.weekdays) !==
          JSON.stringify(existingLatestConfig?.schedule.weekdays) ||
        JSON.stringify(currentSchedule.monthDays) !==
          JSON.stringify(existingLatestConfig?.schedule.monthDays);

      const isTrackingChanged =
        trackingType !== existingLatestConfig?.trackingType ||
        (trackingType === "progressive" &&
          (target !== existingLatestConfig?.target ||
            increment !== existingLatestConfig?.increment ||
            unit.trim() !== (existingLatestConfig?.unit ?? "")));

      let updatedHabit: Habit = {
        ...habitToEdit,
        name: name.trim(),
        categoryId,
        completedColor,
        partialColor,
      };

      if (isScheduleChanged || isTrackingChanged) {
        const newConfig = createHabitConfiguration({
          effectiveFrom: tomorrow,
          trackingType,
          schedule: currentSchedule,
          target: trackingType === "progressive" ? target : undefined,
          increment: trackingType === "progressive" ? increment : undefined,
          unit: trackingType === "progressive" ? unit.trim() : undefined,
        });

        const updateRes = addHabitConfiguration(updatedHabit, newConfig);
        if (updateRes.habit) {
          updatedHabit = updateRes.habit;
        }
      }

      onSave(updatedHabit);
    }
  }

  function handleCreateInlineCategory(e: React.FormEvent) {
    e.preventDefault();
    const result = createCategory(newCategoryName);
    if (!result.category) {
      setCategoryError(result.error ?? "Invalid category name");
      return;
    }

    const nextCats = [...categories, result.category];
    setCategoryId(result.category.id);
    setIsCreatingCategory(false);
    setNewCategoryName("");
    setCategoryError(null);
  }

  const orderedWeekdays = getOrderedWeekdays(settings.firstDayOfWeek);

  return (
    <>
      <div
        className="habit-form-backdrop"
        role="presentation"
        onMouseDown={handleAttemptClose}
      >
        <div
          className="habit-form-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="habit-form-title"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <header className="habit-form-modal__header">
            <h2 id="habit-form-title">
              {isEditing ? "Edit Habit" : "Create Habit"}
            </h2>
            <button
              type="button"
              className="habit-form-modal__close-btn"
              onClick={handleAttemptClose}
              aria-label="Close"
            >
              ✕
            </button>
          </header>

          {isEditing && (
            <div className="habit-form__info-banner">
              Changes to schedule or targets affect future occurrences. Past history is unchanged.
            </div>
          )}

          <form className="habit-form" onSubmit={handleSave}>
            {/* Basic Section */}
            <div className="habit-form__section">
              <label className="habit-form__label" htmlFor="habit-name">
                Habit Name <span className="habit-form__required">*</span>
              </label>
              <input
                id="habit-name"
                type="text"
                className={`habit-form__input ${
                  validationErrors.name ? "habit-form__input--error" : ""
                }`}
                placeholder="e.g. Read 30 pages"
                value={name}
                maxLength={80}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
              {validationErrors.name && (
                <span className="habit-form__error-text">
                  {validationErrors.name}
                </span>
              )}

              {/* Category */}
              <div className="habit-form__field-row">
                <label className="habit-form__label" htmlFor="habit-category">
                  Category
                </label>
                <div className="habit-form__category-row">
                  <select
                    id="habit-category"
                    className="habit-form__select"
                    value={categoryId ?? ""}
                    onChange={(e) =>
                      setCategoryId(e.target.value ? e.target.value : null)
                    }
                  >
                    <option value="">Uncategorized</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="habit-form__new-category-btn"
                    onClick={() => setIsCreatingCategory(true)}
                  >
                    + New
                  </button>
                </div>
              </div>

              {isCreatingCategory && (
                <div className="habit-form__inline-create-category">
                  <input
                    type="text"
                    className="habit-form__input habit-form__input--inline"
                    placeholder="Category name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="habit-form__btn-small habit-form__btn-small--confirm"
                    onClick={handleCreateInlineCategory}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    className="habit-form__btn-small"
                    onClick={() => {
                      setIsCreatingCategory(false);
                      setCategoryError(null);
                    }}
                  >
                    Cancel
                  </button>
                  {categoryError && (
                    <span className="habit-form__error-text">
                      {categoryError}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Tracking Type */}
            <div className="habit-form__section">
              <label className="habit-form__label">Tracking Type</label>
              <div className="habit-form__segmented-control">
                <button
                  type="button"
                  className={`habit-form__segment-btn ${
                    trackingType === "binary"
                      ? "habit-form__segment-btn--active"
                      : ""
                  }`}
                  onClick={() => setTrackingType("binary")}
                >
                  Binary (Done / Not done)
                </button>
                <button
                  type="button"
                  className={`habit-form__segment-btn ${
                    trackingType === "progressive"
                      ? "habit-form__segment-btn--active"
                      : ""
                  }`}
                  onClick={() => setTrackingType("progressive")}
                >
                  Progressive (Target amount)
                </button>
              </div>

              {/* Progressive Settings */}
              {trackingType === "progressive" && (
                <div className="habit-form__progressive-fields">
                  <div className="habit-form__field-group">
                    <label className="habit-form__sublabel" htmlFor="habit-target">
                      Target Amount
                    </label>
                    <input
                      id="habit-target"
                      type="number"
                      min={1}
                      step={1}
                      className={`habit-form__input ${
                        validationErrors.target ? "habit-form__input--error" : ""
                      }`}
                      value={targetStr}
                      onChange={(e) => setTargetStr(e.target.value)}
                    />
                    {validationErrors.target && (
                      <span className="habit-form__error-text">
                        {validationErrors.target}
                      </span>
                    )}
                  </div>

                  <div className="habit-form__field-group">
                    <label className="habit-form__sublabel" htmlFor="habit-increment">
                      Amount Per Press
                    </label>
                    <input
                      id="habit-increment"
                      type="number"
                      min={1}
                      step={1}
                      className={`habit-form__input ${
                        validationErrors.increment
                          ? "habit-form__input--error"
                          : ""
                      }`}
                      value={incrementStr}
                      onChange={(e) => setIncrementStr(e.target.value)}
                    />
                    {validationErrors.increment && (
                      <span className="habit-form__error-text">
                        {validationErrors.increment}
                      </span>
                    )}
                  </div>

                  <div className="habit-form__field-group">
                    <label className="habit-form__sublabel" htmlFor="habit-unit">
                      Unit (Optional)
                    </label>
                    <input
                      id="habit-unit"
                      type="text"
                      className="habit-form__input"
                      placeholder="e.g. pages, minutes"
                      value={unit}
                      maxLength={20}
                      onChange={(e) => setUnit(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Schedule Section */}
            <div className="habit-form__section">
              <label className="habit-form__label">Recurrence Schedule</label>
              <div className="habit-form__segmented-control">
                <button
                  type="button"
                  className={`habit-form__segment-btn ${
                    scheduleType === "daily"
                      ? "habit-form__segment-btn--active"
                      : ""
                  }`}
                  onClick={() => setScheduleType("daily")}
                >
                  Every day
                </button>
                <button
                  type="button"
                  className={`habit-form__segment-btn ${
                    scheduleType === "weekly"
                      ? "habit-form__segment-btn--active"
                      : ""
                  }`}
                  onClick={() => setScheduleType("weekly")}
                >
                  Specific weekdays
                </button>
                <button
                  type="button"
                  className={`habit-form__segment-btn ${
                    scheduleType === "monthly"
                      ? "habit-form__segment-btn--active"
                      : ""
                  }`}
                  onClick={() => setScheduleType("monthly")}
                >
                  Days of month
                </button>
              </div>

              {scheduleType === "weekly" && (
                <div className="habit-form__weekdays-selector">
                  {orderedWeekdays.map((w) => {
                    const isSelected = weekdays.includes(w);
                    return (
                      <button
                        key={w}
                        type="button"
                        className={`habit-form__weekday-btn ${
                          isSelected ? "habit-form__weekday-btn--selected" : ""
                        }`}
                        onClick={() => {
                          setWeekdays((curr) =>
                            isSelected
                              ? curr.filter((d) => d !== w)
                              : [...curr, w],
                          );
                        }}
                      >
                        {getWeekdayShortName(w)}
                      </button>
                    );
                  })}
                </div>
              )}

              {scheduleType === "monthly" && (
                <div className="habit-form__monthdays-grid">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
                    const isSelected = monthDays.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        className={`habit-form__monthday-btn ${
                          isSelected ? "habit-form__monthday-btn--selected" : ""
                        }`}
                        onClick={() => {
                          setMonthDays((curr) =>
                            isSelected
                              ? curr.filter((val) => val !== d)
                              : [...curr, d].sort((a, b) => a - b),
                          );
                        }}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              )}

              {validationErrors.schedule && (
                <span className="habit-form__error-text">
                  {validationErrors.schedule}
                </span>
              )}

              <div className="habit-form__schedule-preview">
                Summary: <strong>{scheduleSummary}</strong>
              </div>
            </div>

            {/* Start Date */}
            {!isEditing && (
              <div className="habit-form__section">
                <label className="habit-form__label" htmlFor="habit-start-date">
                  Start Date
                </label>
                <input
                  id="habit-start-date"
                  type="date"
                  className="habit-form__input habit-form__input--date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            )}

            {/* Appearance Colors */}
            <div className="habit-form__section">
              <label className="habit-form__label">Appearance Colors</label>
              <div className="habit-form__colors-config">
                {/* Completed Color */}
                <div className="habit-form__color-picker-item">
                  <span className="habit-form__sublabel">Completed Color</span>
                  <div className="habit-form__color-input-row">
                    <input
                      type="color"
                      className="habit-form__color-native"
                      value={completedColor}
                      onChange={(e) => setCompletedColor(e.target.value)}
                    />
                    <div className="habit-form__color-presets">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={`completed-${color}`}
                          type="button"
                          className={`habit-form__color-preset-dot ${
                            completedColor === color
                              ? "habit-form__color-preset-dot--selected"
                              : ""
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setCompletedColor(color)}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Partial Color */}
                {trackingType === "progressive" && (
                  <div className="habit-form__color-picker-item">
                    <span className="habit-form__sublabel">
                      Partial Progress Color
                    </span>
                    <div className="habit-form__color-input-row">
                      <input
                        type="color"
                        className="habit-form__color-native"
                        value={partialColor}
                        onChange={(e) => setPartialColor(e.target.value)}
                      />
                      <div className="habit-form__color-presets">
                        {PRESET_COLORS.map((color) => (
                          <button
                            key={`partial-${color}`}
                            type="button"
                            className={`habit-form__color-preset-dot ${
                              partialColor === color
                                ? "habit-form__color-preset-dot--selected"
                                : ""
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => setPartialColor(color)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Live Habit Card Preview */}
            <div className="habit-form__section">
              <label className="habit-form__label">Live Preview</label>
              <div className="habit-form__preview-card">
                <div className="habit-form__preview-action">
                  {trackingType === "binary" ? (
                    <div
                      className="habit-form__preview-check"
                      style={{
                        backgroundColor: completedColor,
                        borderColor: completedColor,
                      }}
                    >
                      ✓
                    </div>
                  ) : (
                    <div
                      className="habit-form__preview-inc"
                      style={{ borderColor: completedColor, color: completedColor }}
                    >
                      +{increment > 0 ? increment : 1}
                    </div>
                  )}
                </div>

                <div className="habit-form__preview-info">
                  <div className="habit-form__preview-title-row">
                    <span className="habit-form__preview-title">
                      {name.trim() || "Habit Name"}
                    </span>
                    {categoryId && (
                      <span className="habit-form__preview-category">
                        {categories.find((c) => c.id === categoryId)?.name}
                      </span>
                    )}
                  </div>
                  {trackingType === "progressive" && (
                    <div className="habit-form__preview-progress-row">
                      <div className="habit-form__preview-bar">
                        <div
                          className="habit-form__preview-fill"
                          style={{
                            width: "50%",
                            backgroundColor: partialColor,
                          }}
                        />
                      </div>
                      <span className="habit-form__preview-amount">
                        {Math.floor(target / 2)} / {target || 30}
                        {unit ? ` ${unit}` : ""}
                      </span>
                    </div>
                  )}
                </div>

                <div className="habit-form__preview-streak">🔥 0</div>
              </div>
            </div>

            {/* Actions */}
            <div className="habit-form__footer-actions">
              <button
                type="button"
                className="habit-form__btn habit-form__btn--cancel"
                onClick={handleAttemptClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="habit-form__btn habit-form__btn--submit"
                disabled={!isValid}
              >
                {isEditing ? "Save Changes" : "Create Habit"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDiscardConfirm}
        title="Discard changes?"
        message="You have unsaved changes. Are you sure you want to discard them?"
        confirmLabel="Discard"
        cancelLabel="Keep Editing"
        isDestructive={true}
        onConfirm={() => {
          setShowDiscardConfirm(false);
          onCancel();
        }}
        onCancel={() => setShowDiscardConfirm(false)}
      />
    </>
  );
}

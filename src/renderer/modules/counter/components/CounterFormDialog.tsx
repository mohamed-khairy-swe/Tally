import React, { useMemo, useState } from "react";
import type { Counter, CounterSettings } from "../types";
import {
  createNewCounter,
  updateCounterConfig,
} from "../state/counterOperations";
import { validateCounterInput } from "../state/counterValidation";
import { ConfirmModal } from "../../habits/components/ConfirmModal";
import "./CounterFormDialog.css";

interface CounterFormDialogProps {
  readonly counterToEdit?: Counter | null;
  readonly settings: CounterSettings;
  readonly onSave: (counter: Counter) => void;
  readonly onCancel: () => void;
}

const PRESET_ICONS = [
  "💪",
  "💧",
  "📚",
  "🏃",
  "☕",
  "🎯",
  "🍎",
  "💻",
  "📦",
  "⭐️",
  "🔥",
  "✅",
] as const;

const PRESET_COLORS = [
  "#6750a4", // purple (default)
  "#386a20", // forest green
  "#1967d2", // blue
  "#c47c16", // amber
  "#b3261e", // red
  "#2e6b56", // teal
  "#795548", // brown
  "#455a64", // slate
] as const;

export function CounterFormDialog({
  counterToEdit,
  settings,
  onSave,
  onCancel,
}: CounterFormDialogProps) {
  const isEditing = Boolean(counterToEdit);

  // Form Fields
  const [name, setName] = useState(counterToEdit?.name ?? "");
  const [description, setDescription] = useState(
    counterToEdit?.description ?? "",
  );
  const [icon, setIcon] = useState<string | null>(counterToEdit?.icon ?? null);
  const [color, setColor] = useState<string>(
    counterToEdit?.color ?? settings.defaultColor,
  );

  const [startingValueStr, setStartingValueStr] = useState<string>(
    (counterToEdit?.startingValue ?? 0).toString(),
  );
  const [incrementStr, setIncrementStr] = useState<string>(
    (counterToEdit?.increment ?? settings.defaultIncrement).toString(),
  );

  const [hasTarget, setHasTarget] = useState(
    counterToEdit ? counterToEdit.target !== null : false,
  );
  const [targetStr, setTargetStr] = useState<string>(
    (counterToEdit?.target ?? 50).toString(),
  );
  const [unit, setUnit] = useState<string>(counterToEdit?.unit ?? "");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Parse numbers
  const startingValue = parseInt(startingValueStr, 10);
  const increment = parseInt(incrementStr, 10);
  const target = hasTarget ? parseInt(targetStr, 10) : null;

  // Validation
  const validation = useMemo(() => {
    return validateCounterInput({
      name,
      startingValue: isNaN(startingValue) ? -1 : startingValue,
      increment: isNaN(increment) ? 0 : increment,
      target: hasTarget ? (isNaN(target!) ? 0 : target) : null,
      unit,
      description,
    });
  }, [name, startingValue, increment, hasTarget, target, unit, description]);

  // Dirty check
  const isDirty = useMemo(() => {
    if (!counterToEdit) {
      return Boolean(name.trim());
    }
    return (
      name !== counterToEdit.name ||
      description !== counterToEdit.description ||
      icon !== counterToEdit.icon ||
      color !== counterToEdit.color ||
      startingValueStr !== counterToEdit.startingValue.toString() ||
      incrementStr !== counterToEdit.increment.toString() ||
      hasTarget !== (counterToEdit.target !== null) ||
      (hasTarget && targetStr !== (counterToEdit.target?.toString() ?? "50")) ||
      unit !== (counterToEdit.unit ?? "")
    );
  }, [
    counterToEdit,
    name,
    description,
    icon,
    color,
    startingValueStr,
    incrementStr,
    hasTarget,
    targetStr,
    unit,
  ]);

  function handleAttemptClose() {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      onCancel();
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!validation.valid || isSubmitting) return;

    setIsSubmitting(true);

    if (!counterToEdit) {
      // Create new counter
      const newCounter = createNewCounter({
        name,
        description: description || undefined,
        startingValue,
        increment,
        target,
        unit: unit || undefined,
        icon: icon || undefined,
        color,
      });
      onSave(newCounter);
    } else {
      // Edit existing counter
      const updated = updateCounterConfig(counterToEdit, {
        name: name.trim(),
        description: description.trim(),
        startingValue,
        increment,
        target,
        unit: unit.trim() || null,
        icon,
        color,
      });
      onSave(updated);
    }
  }

  // Preview values
  const previewValue = counterToEdit ? counterToEdit.currentValue : startingValue || 0;
  const previewTarget = hasTarget && target && target > 0 ? target : null;
  const previewPercent = previewTarget
    ? Math.min(100, Math.round((previewValue / previewTarget) * 100))
    : 0;

  return (
    <>
      <div
        className="counter-form-backdrop"
        role="presentation"
        onMouseDown={handleAttemptClose}
      >
        <div
          className="counter-form-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="counter-form-title"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <header className="counter-form-modal__header">
            <h2 id="counter-form-title">
              {isEditing ? "Edit Counter" : "Create Counter"}
            </h2>
            <button
              type="button"
              className="counter-form-modal__close-btn"
              onClick={handleAttemptClose}
              aria-label="Close"
            >
              ✕
            </button>
          </header>

          {isEditing && (
            <div className="counter-form__info-banner">
              Editing configuration does not alter current value or past counting history.
            </div>
          )}

          <form className="counter-form" onSubmit={handleSubmit}>
            {/* Basic Section */}
            <div className="counter-form__section">
              <label className="counter-form__label" htmlFor="counter-name">
                Counter Name <span className="counter-form__required">*</span>
              </label>
              <input
                id="counter-name"
                type="text"
                className={`counter-form__input ${
                  validation.errors.name ? "counter-form__input--error" : ""
                }`}
                placeholder="e.g. Push-ups"
                value={name}
                maxLength={80}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
              {validation.errors.name && (
                <span className="counter-form__error-text">
                  {validation.errors.name}
                </span>
              )}

              <label
                className="counter-form__sublabel"
                htmlFor="counter-desc"
                style={{ marginTop: 4 }}
              >
                Description (Optional)
              </label>
              <input
                id="counter-desc"
                type="text"
                className="counter-form__input"
                placeholder="Short note or purpose"
                value={description}
                maxLength={300}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Icon & Color */}
            <div className="counter-form__section">
              <label className="counter-form__label">Icon & Color</label>
              <div className="counter-form__icons-row">
                <button
                  type="button"
                  className={`counter-form__icon-btn ${
                    icon === null ? "counter-form__icon-btn--selected" : ""
                  }`}
                  onClick={() => setIcon(null)}
                  title="No icon"
                >
                  None
                </button>
                {PRESET_ICONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className={`counter-form__icon-btn ${
                      icon === emoji ? "counter-form__icon-btn--selected" : ""
                    }`}
                    onClick={() => setIcon(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <div className="counter-form__colors-row">
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={`counter-form__color-dot ${
                      color === preset ? "counter-form__color-dot--selected" : ""
                    }`}
                    style={{ backgroundColor: preset }}
                    onClick={() => setColor(preset)}
                    aria-label={`Color ${preset}`}
                  />
                ))}
              </div>
            </div>

            {/* Counting Section */}
            <div className="counter-form__section">
              <label className="counter-form__label">Counting Options</label>
              <div className="counter-form__grid-row">
                <div className="counter-form__field">
                  <label
                    className="counter-form__sublabel"
                    htmlFor="counter-starting"
                  >
                    Starting Value
                  </label>
                  <input
                    id="counter-starting"
                    type="number"
                    min={0}
                    step={1}
                    className={`counter-form__input ${
                      validation.errors.startingValue
                        ? "counter-form__input--error"
                        : ""
                    }`}
                    value={startingValueStr}
                    onChange={(e) => setStartingValueStr(e.target.value)}
                  />
                  {validation.errors.startingValue && (
                    <span className="counter-form__error-text">
                      {validation.errors.startingValue}
                    </span>
                  )}
                </div>

                <div className="counter-form__field">
                  <label
                    className="counter-form__sublabel"
                    htmlFor="counter-increment"
                  >
                    Increment Amount
                  </label>
                  <input
                    id="counter-increment"
                    type="number"
                    min={1}
                    step={1}
                    className={`counter-form__input ${
                      validation.errors.increment
                        ? "counter-form__input--error"
                        : ""
                    }`}
                    value={incrementStr}
                    onChange={(e) => setIncrementStr(e.target.value)}
                  />
                  {validation.errors.increment && (
                    <span className="counter-form__error-text">
                      {validation.errors.increment}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Target & Unit Section */}
            <div className="counter-form__section">
              <label className="counter-form__label">Target & Unit (Optional)</label>
              <div className="counter-form__field">
                <label className="counter-form__sublabel" htmlFor="counter-unit">
                  Unit Label
                </label>
                <input
                  id="counter-unit"
                  type="text"
                  className="counter-form__input"
                  placeholder="e.g. push-ups, glasses, pages"
                  value={unit}
                  maxLength={30}
                  onChange={(e) => setUnit(e.target.value)}
                />
              </div>

              <div className="counter-form__target-toggle-row">
                <label className="counter-form__checkbox-label">
                  <input
                    type="checkbox"
                    checked={hasTarget}
                    onChange={(e) => setHasTarget(e.target.checked)}
                  />
                  <span>Set target goal</span>
                </label>

                {hasTarget && (
                  <div className="counter-form__target-input-wrap">
                    <input
                      type="number"
                      min={1}
                      step={1}
                      className={`counter-form__input ${
                        validation.errors.target
                          ? "counter-form__input--error"
                          : ""
                      }`}
                      placeholder="e.g. 50"
                      value={targetStr}
                      onChange={(e) => setTargetStr(e.target.value)}
                    />
                    {validation.errors.target && (
                      <span className="counter-form__error-text">
                        {validation.errors.target}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Live Preview Section */}
            <div className="counter-form__section">
              <label className="counter-form__label">Live Preview</label>
              <div
                className="counter-form__preview-card"
                style={{ "--counter-accent": color } as React.CSSProperties}
              >
                <div className="counter-form__preview-header">
                  {icon && (
                    <span className="counter-form__preview-icon">{icon}</span>
                  )}
                  <span className="counter-form__preview-name">
                    {name.trim() || "Counter Name"}
                  </span>
                </div>

                <div className="counter-form__preview-value">
                  {previewValue.toLocaleString()}
                  {unit && (
                    <span className="counter-form__preview-unit">
                      {" "}
                      {unit}
                    </span>
                  )}
                </div>

                {previewTarget && (
                  <div className="counter-form__preview-target-bar">
                    <div className="counter-form__preview-target-bg">
                      <div
                        className="counter-form__preview-target-fill"
                        style={{
                          width: `${previewPercent}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                    <span className="counter-form__preview-target-label">
                      Target: {previewTarget.toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="counter-form__preview-controls">
                  <span className="counter-form__preview-btn">
                    −{increment > 0 ? increment : 1}
                  </span>
                  <span
                    className="counter-form__preview-btn counter-form__preview-btn--inc"
                    style={{ backgroundColor: color }}
                  >
                    +{increment > 0 ? increment : 1}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="counter-form__footer-actions">
              <button
                type="button"
                className="counter-form__btn counter-form__btn--cancel"
                onClick={handleAttemptClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="counter-form__btn counter-form__btn--submit"
                disabled={!validation.valid || isSubmitting}
              >
                {isEditing ? "Save Changes" : "Create Counter"}
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

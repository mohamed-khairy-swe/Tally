import React, { useState } from "react";
import type { Counter } from "../types";
import "./CounterCard.css";

interface CounterCardProps {
  readonly counter: Counter;
  readonly canUndo: boolean;
  readonly onIncrement: () => void;
  readonly onDecrement: () => void;
  readonly onReset: () => void;
  readonly onUndo: () => void;
  readonly onOpenFocus: () => void;
  readonly onOpenDetails: () => void;
  readonly onEdit: () => void;
  readonly onArchive: () => void;
}

export function CounterCard({
  counter,
  canUndo,
  onIncrement,
  onDecrement,
  onReset,
  onUndo,
  onOpenFocus,
  onOpenDetails,
  onEdit,
  onArchive,
}: CounterCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isAtZero = counter.currentValue <= 0;
  const hasTarget = counter.target !== null;
  const isTargetReached = hasTarget && counter.currentValue >= counter.target!;

  const progressPercent = hasTarget
    ? Math.min(100, Math.round((counter.currentValue / counter.target!) * 100))
    : 0;

  function stopPropagation(e: React.MouseEvent, action: () => void) {
    e.stopPropagation();
    action();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    // Only capture shortcuts when focused directly on the card
    if (event.target !== event.currentTarget) {
      return;
    }

    if (event.key === "ArrowUp" || event.key === "+") {
      event.preventDefault();
      onIncrement();
    } else if (event.key === "ArrowDown" || event.key === "-") {
      event.preventDefault();
      if (!isAtZero) {
        onDecrement();
      }
    } else if (event.key === "Enter") {
      event.preventDefault();
      onOpenDetails();
    }
  }

  const customAccentStyle = counter.color
    ? ({ "--counter-accent": counter.color } as React.CSSProperties)
    : undefined;

  return (
    <article
      className="counter-card"
      style={customAccentStyle}
      onClick={onOpenDetails}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label={`Counter ${counter.name}, current value: ${counter.currentValue}`}
    >
      {/* Top Identity Row */}
      <div className="counter-card__header">
        <div className="counter-card__identity">
          {counter.icon && (
            <span className="counter-card__icon" aria-hidden="true">
              {counter.icon}
            </span>
          )}
          <div className="counter-card__titles">
            <h3 className="counter-card__name" title={counter.name}>
              {counter.name}
            </h3>
            {counter.description && (
              <p className="counter-card__desc" title={counter.description}>
                {counter.description}
              </p>
            )}
          </div>
        </div>

        {/* Card Options Menu */}
        <div className="counter-card__menu-wrapper">
          <button
            type="button"
            className="counter-card__menu-trigger"
            onClick={(e) => stopPropagation(e, () => setIsMenuOpen((prev) => !prev))}
            aria-label={`More options for ${counter.name}`}
            aria-expanded={isMenuOpen}
          >
            ⋮
          </button>

          {isMenuOpen && (
            <div
              className="counter-card__dropdown"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="counter-card__dropdown-item"
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenFocus();
                }}
              >
                ⛶ Focus Mode
              </button>
              <button
                type="button"
                className="counter-card__dropdown-item"
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenDetails();
                }}
              >
                📋 View History
              </button>
              <button
                type="button"
                className="counter-card__dropdown-item"
                onClick={() => {
                  setIsMenuOpen(false);
                  onEdit();
                }}
              >
                ✏ Edit Counter
              </button>
              <button
                type="button"
                className="counter-card__dropdown-item counter-card__dropdown-item--archive"
                onClick={() => {
                  setIsMenuOpen(false);
                  onArchive();
                }}
              >
                📦 Archive
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Value Display */}
      <div className="counter-card__value-section">
        <div className="counter-card__value-row">
          <span className="counter-card__number">
            {counter.currentValue.toLocaleString()}
          </span>
          {counter.unit && (
            <span className="counter-card__unit">{counter.unit}</span>
          )}
        </div>

        {/* Target Progress Bar */}
        {hasTarget && (
          <div className="counter-card__target-container">
            <div className="counter-card__target-bar-bg">
              <div
                className={`counter-card__target-bar-fill ${
                  isTargetReached ? "counter-card__target-bar-fill--reached" : ""
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="counter-card__target-meta">
              <span className="counter-card__target-label">
                Target: {counter.target!.toLocaleString()}
                {counter.unit ? ` ${counter.unit}` : ""}
              </span>
              {isTargetReached && (
                <span className="counter-card__target-reached-badge">
                  ✓ Target reached
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Primary Counting Controls */}
      <div className="counter-card__controls">
        <button
          type="button"
          className="counter-card__btn counter-card__btn--decrement"
          onClick={(e) => stopPropagation(e, onDecrement)}
          disabled={isAtZero}
          aria-label={`Decrement ${counter.name} by ${counter.increment}`}
          title={isAtZero ? "Counter is at zero" : `Subtract ${counter.increment}`}
        >
          −{counter.increment}
        </button>

        <button
          type="button"
          className="counter-card__btn counter-card__btn--increment"
          onClick={(e) => stopPropagation(e, onIncrement)}
          aria-label={`Increment ${counter.name} by ${counter.increment}`}
          title={`Add ${counter.increment}`}
        >
          +{counter.increment}
        </button>
      </div>

      {/* Secondary Actions Row */}
      <div className="counter-card__secondary-actions">
        <button
          type="button"
          className="counter-card__sub-action"
          onClick={(e) => stopPropagation(e, onUndo)}
          disabled={!canUndo}
          aria-label={`Undo last change for ${counter.name}`}
          title={canUndo ? "Undo last change" : "No actions to undo"}
        >
          ↶ Undo
        </button>

        <button
          type="button"
          className="counter-card__sub-action"
          onClick={(e) => stopPropagation(e, onReset)}
          aria-label={`Reset ${counter.name}`}
          title={`Reset to starting value (${counter.startingValue})`}
        >
          ↺ Reset
        </button>

        <button
          type="button"
          className="counter-card__sub-action"
          onClick={(e) => stopPropagation(e, onOpenFocus)}
          aria-label={`Open Focus Mode for ${counter.name}`}
          title="Open distraction-free Focus Mode"
        >
          ⛶ Focus
        </button>

        <button
          type="button"
          className="counter-card__sub-action"
          onClick={(e) => stopPropagation(e, onOpenDetails)}
          aria-label={`Open history and details for ${counter.name}`}
          title="View history & details"
        >
          History
        </button>
      </div>
    </article>
  );
}

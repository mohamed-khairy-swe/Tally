import React, { useEffect } from "react";
import type { Counter } from "../types";
import "./CounterFocusView.css";

interface CounterFocusViewProps {
  readonly counter: Counter;
  readonly canUndo: boolean;
  readonly onIncrement: () => void;
  readonly onDecrement: () => void;
  readonly onReset: () => void;
  readonly onUndo: () => void;
  readonly onExit: () => void;
}

export function CounterFocusView({
  counter,
  canUndo,
  onIncrement,
  onDecrement,
  onReset,
  onUndo,
  onExit,
}: CounterFocusViewProps) {
  const isAtZero = counter.currentValue <= 0;
  const hasTarget = counter.target !== null;
  const isTargetReached = hasTarget && counter.currentValue >= counter.target!;

  // Keyboard controls
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onExit();
      } else if (
        event.key === "ArrowUp" ||
        event.key === "+" ||
        event.key === " " ||
        event.key === "Enter"
      ) {
        event.preventDefault();
        onIncrement();
      } else if (event.key === "ArrowDown" || event.key === "-") {
        event.preventDefault();
        if (counter.currentValue > 0) {
          onDecrement();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [counter.currentValue, onIncrement, onDecrement, onExit]);

  const customAccentStyle = counter.color
    ? ({ "--counter-accent": counter.color } as React.CSSProperties)
    : undefined;

  return (
    <div
      className="counter-focus-view"
      style={customAccentStyle}
      role="region"
      aria-label={`Focus Mode for ${counter.name}`}
    >
      {/* Header bar */}
      <div className="counter-focus-view__header">
        <button
          type="button"
          className="counter-focus-view__exit-btn"
          onClick={onExit}
          title="Exit Focus Mode (Escape)"
        >
          ← Exit Focus
        </button>
      </div>

      {/* Main Center Area */}
      <div className="counter-focus-view__center">
        <div className="counter-focus-view__identity">
          {counter.icon && (
            <span className="counter-focus-view__icon">{counter.icon}</span>
          )}
          <h1 className="counter-focus-view__name">{counter.name}</h1>
        </div>

        {/* Huge Number */}
        <div className="counter-focus-view__value">
          {counter.currentValue.toLocaleString()}
        </div>

        {/* Unit and Target Meta */}
        <div className="counter-focus-view__meta">
          {counter.unit && (
            <span className="counter-focus-view__unit">{counter.unit}</span>
          )}
          {hasTarget && (
            <span className="counter-focus-view__target">
              Target: {counter.target!.toLocaleString()}
              {isTargetReached ? " · Reached ✓" : ""}
            </span>
          )}
        </div>

        {/* Giant Primary Increment Button */}
        <button
          type="button"
          className="counter-focus-view__giant-btn"
          onClick={onIncrement}
          aria-label={`Add ${counter.increment}`}
          autoFocus
        >
          +{counter.increment}
        </button>

        {/* Secondary Controls */}
        <div className="counter-focus-view__sub-controls">
          <button
            type="button"
            className="counter-focus-view__sub-btn"
            onClick={onDecrement}
            disabled={isAtZero}
            aria-label={`Subtract ${counter.increment}`}
          >
            −{counter.increment}
          </button>

          <button
            type="button"
            className="counter-focus-view__sub-btn"
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="Undo last count"
          >
            ↶ Undo
          </button>

          <button
            type="button"
            className="counter-focus-view__sub-btn"
            onClick={onReset}
            aria-label="Reset to starting value"
          >
            ↺ Reset
          </button>
        </div>

        {/* Keyboard hints */}
        <div className="counter-focus-view__hints">
          <span>Space / Enter / ↑ to count</span>
          <span>↓ to subtract</span>
          <span>Esc to exit</span>
        </div>
      </div>
    </div>
  );
}

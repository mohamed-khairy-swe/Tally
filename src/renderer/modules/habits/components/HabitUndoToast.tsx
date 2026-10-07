import React from "react";
import "./HabitUndoToast.css";

interface HabitUndoToastProps {
  readonly habitName: string;
  readonly onUndo: () => void;
  readonly onDismiss: () => void;
}

export function HabitUndoToast({
  habitName,
  onUndo,
  onDismiss,
}: HabitUndoToastProps) {
  return (
    <div className="habit-undo-toast" role="status" aria-live="polite">
      <span className="habit-undo-toast__message">
        Completed <strong>{habitName}</strong>
      </span>
      <div className="habit-undo-toast__actions">
        <button
          type="button"
          className="habit-undo-toast__undo-btn"
          onClick={onUndo}
        >
          Undo
        </button>
        <button
          type="button"
          className="habit-undo-toast__close-btn"
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

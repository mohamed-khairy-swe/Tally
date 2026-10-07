import React from "react";
import "./CounterUndoToast.css";

interface CounterUndoToastProps {
  readonly message: string;
  readonly onUndo: () => void;
  readonly onDismiss: () => void;
}

export function CounterUndoToast({
  message,
  onUndo,
  onDismiss,
}: CounterUndoToastProps) {
  return (
    <div className="counter-undo-toast" role="status" aria-live="polite">
      <span className="counter-undo-toast__message">{message}</span>
      <div className="counter-undo-toast__actions">
        <button
          type="button"
          className="counter-undo-toast__undo-btn"
          onClick={onUndo}
        >
          Undo
        </button>
        <button
          type="button"
          className="counter-undo-toast__close-btn"
          onClick={onDismiss}
          aria-label="Dismiss notification"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

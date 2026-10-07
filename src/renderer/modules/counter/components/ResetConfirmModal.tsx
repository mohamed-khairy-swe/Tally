import React, { useEffect } from "react";
import type { Counter } from "../types";
import "./ResetConfirmModal.css";

interface ResetConfirmModalProps {
  readonly counter: Counter | null;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

export function ResetConfirmModal({
  counter,
  onConfirm,
  onCancel,
}: ResetConfirmModalProps) {
  useEffect(() => {
    if (!counter) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [counter, onCancel]);

  if (!counter) return null;

  return (
    <div
      className="reset-modal-backdrop"
      role="presentation"
      onMouseDown={onCancel}
    >
      <div
        className="reset-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="reset-modal-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h3 id="reset-modal-title" className="reset-modal__title">
          Reset "{counter.name}"?
        </h3>
        <p className="reset-modal__message">
          Current value: <strong>{counter.currentValue.toLocaleString()}</strong>
          <br />
          Reset to: <strong>{counter.startingValue.toLocaleString()}</strong>
        </p>
        <span className="reset-modal__hint">
          This operation can be reversed using Undo.
        </span>

        <div className="reset-modal__actions">
          <button
            type="button"
            className="reset-modal__btn reset-modal__btn--cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="reset-modal__btn reset-modal__btn--confirm"
            onClick={onConfirm}
            autoFocus
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import type { Counter, CounterSettings, CounterSnapshot } from "../types";
import { ConfirmModal } from "../../habits/components/ConfirmModal";
import { DEFAULT_COUNTER_SETTINGS } from "../state/counterStore";
import "./CounterSettingsView.css";

interface CounterSettingsViewProps {
  readonly settings: CounterSettings;
  readonly counters: readonly Counter[];
  readonly onUpdateSettings: (next: CounterSettings) => void;
  readonly onRestoreCounter: (id: string) => void;
  readonly onDeletePermanently: (id: string) => void;
  readonly onBack: () => void;
}

export function CounterSettingsView({
  settings,
  counters,
  onUpdateSettings,
  onRestoreCounter,
  onDeletePermanently,
  onBack,
}: CounterSettingsViewProps) {
  const archivedCounters = counters.filter((c) => c.archived);
  const [counterToDelete, setCounterToDelete] = useState<Counter | null>(null);

  return (
    <section className="counter-settings-view" aria-label="Counter Settings">
      {/* Header */}
      <div className="counter-settings-view__header">
        <button
          type="button"
          className="counter-settings-view__back-btn"
          onClick={onBack}
        >
          ← Back to Counters
        </button>
        <h1 className="counter-settings-view__title">Settings</h1>
      </div>

      {/* Defaults Card */}
      <div className="counter-settings-view__card">
        <h2 className="counter-settings-view__card-title">Defaults for New Counters</h2>
        <p className="counter-settings-view__hint">
          These values are pre-filled when you create a new counter. Each counter can override them individually.
        </p>

        <div className="counter-settings-view__fields">
          {/* Default Increment */}
          <div className="counter-settings-view__field">
            <label className="counter-settings-view__label" htmlFor="def-increment">
              Default Increment Amount
            </label>
            <input
              id="def-increment"
              type="number"
              min={1}
              step={1}
              className="counter-settings-view__input"
              value={settings.defaultIncrement}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (v > 0) {
                  onUpdateSettings({ ...settings, defaultIncrement: v });
                }
              }}
            />
          </div>

          {/* Default Color */}
          <div className="counter-settings-view__field">
            <label className="counter-settings-view__label" htmlFor="def-color">
              Default Accent Color
            </label>
            <div className="counter-settings-view__color-row">
              <input
                id="def-color"
                type="color"
                className="counter-settings-view__color-input"
                value={settings.defaultColor}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, defaultColor: e.target.value })
                }
              />
              <span className="counter-settings-view__color-hex">
                {settings.defaultColor}
              </span>
            </div>
          </div>

          {/* Confirm Reset */}
          <div className="counter-settings-view__field">
            <label className="counter-settings-view__checkbox-label">
              <input
                type="checkbox"
                checked={settings.confirmReset}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, confirmReset: e.target.checked })
                }
              />
              <span>Ask for confirmation before resetting a counter</span>
            </label>
            <p className="counter-settings-view__hint" style={{ margin: 0 }}>
              When enabled, a dialog will appear before any Reset action to prevent accidental resets.
            </p>
          </div>
        </div>

        {/* Restore defaults button */}
        <button
          type="button"
          className="counter-settings-view__btn counter-settings-view__btn--secondary"
          onClick={() => onUpdateSettings({ ...DEFAULT_COUNTER_SETTINGS })}
        >
          Restore Default Settings
        </button>
      </div>

      {/* Archived Counters */}
      <div className="counter-settings-view__card">
        <h2 className="counter-settings-view__card-title">Archived Counters</h2>
        <p className="counter-settings-view__hint">
          Archived counters are hidden from the main list. Their counting history is fully preserved.
          Restore them to bring them back, or permanently delete them to free up space.
        </p>

        {archivedCounters.length === 0 ? (
          <div className="counter-settings-view__empty">No archived counters.</div>
        ) : (
          <div className="counter-settings-view__archived-list">
            {archivedCounters.map((counter) => (
              <div key={counter.id} className="counter-settings-view__archived-row">
                <div className="counter-settings-view__archived-info">
                  <span className="counter-settings-view__archived-icon">
                    {counter.icon ?? "🔢"}
                  </span>
                  <div>
                    <div className="counter-settings-view__archived-name">
                      {counter.name}
                    </div>
                    <div className="counter-settings-view__archived-value">
                      Current value: {counter.currentValue.toLocaleString()}
                      {counter.unit ? ` ${counter.unit}` : ""}
                    </div>
                  </div>
                </div>
                <div className="counter-settings-view__archived-actions">
                  <button
                    type="button"
                    className="counter-settings-view__btn counter-settings-view__btn--primary"
                    onClick={() => onRestoreCounter(counter.id)}
                  >
                    Restore
                  </button>
                  <button
                    type="button"
                    className="counter-settings-view__btn counter-settings-view__btn--destructive"
                    onClick={() => setCounterToDelete(counter)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Permanent Delete Confirmation */}
      <ConfirmModal
        isOpen={Boolean(counterToDelete)}
        title="Permanently Delete Counter?"
        message={`Delete "${counterToDelete?.name}"? This will permanently erase the counter and its entire counting history. This action cannot be undone.`}
        confirmLabel="Delete Permanently"
        cancelLabel="Cancel"
        isDestructive
        onConfirm={() => {
          if (counterToDelete) {
            onDeletePermanently(counterToDelete.id);
            setCounterToDelete(null);
          }
        }}
        onCancel={() => setCounterToDelete(null)}
      />
    </section>
  );
}

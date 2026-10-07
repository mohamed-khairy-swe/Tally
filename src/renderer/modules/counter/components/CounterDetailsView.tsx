import React, { useMemo, useState } from "react";
import type { Counter, CounterHistoryEvent } from "../types";
import { ConfirmModal } from "../../habits/components/ConfirmModal";
import "./CounterDetailsView.css";

interface CounterDetailsViewProps {
  readonly counter: Counter;
  readonly history: readonly CounterHistoryEvent[];
  readonly canUndo: boolean;
  readonly onIncrement: () => void;
  readonly onDecrement: () => void;
  readonly onReset: () => void;
  readonly onUndo: () => void;
  readonly onClearHistory: () => void;
  readonly onOpenFocus: () => void;
  readonly onEdit: () => void;
  readonly onArchive: () => void;
  readonly onRestore: () => void;
  readonly onBack: () => void;
}

const PAGE_SIZE = 50;

export function CounterDetailsView({
  counter,
  history,
  canUndo,
  onIncrement,
  onDecrement,
  onReset,
  onUndo,
  onClearHistory,
  onOpenFocus,
  onEdit,
  onArchive,
  onRestore,
  onBack,
}: CounterDetailsViewProps) {
  const [displayLimit, setDisplayLimit] = useState(PAGE_SIZE);
  const [isClearHistoryConfirmOpen, setIsClearHistoryConfirmOpen] = useState(false);

  // Filter history for this counter
  const counterHistory = useMemo(() => {
    return history.filter((e) => e.counterId === counter.id);
  }, [history, counter.id]);

  const visibleHistory = useMemo(() => {
    return counterHistory.slice(0, displayLimit);
  }, [counterHistory, displayLimit]);

  const hasMoreHistory = counterHistory.length > displayLimit;

  // Group events by day label
  const groupedHistory = useMemo(() => {
    const todayStr = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    const groups: Array<{ label: string; events: CounterHistoryEvent[] }> = [];

    for (const event of visibleHistory) {
      const eventDate = new Date(event.timestamp);
      const dateString = eventDate.toDateString();

      let label = dateString;
      if (dateString === todayStr) {
        label = "Today";
      } else if (dateString === yesterdayStr) {
        label = "Yesterday";
      }

      const existingGroup = groups.find((g) => g.label === label);
      if (existingGroup) {
        existingGroup.events.push(event);
      } else {
        groups.push({ label, events: [event] });
      }
    }

    return groups;
  }, [visibleHistory]);

  const isAtZero = counter.currentValue <= 0;
  const hasTarget = counter.target !== null;
  const isTargetReached = hasTarget && counter.currentValue >= counter.target!;

  const customAccentStyle = counter.color
    ? ({ "--counter-accent": counter.color } as React.CSSProperties)
    : undefined;

  return (
    <section
      className="counter-details-view"
      style={customAccentStyle}
      aria-label={`Details for ${counter.name}`}
    >
      {/* Header bar */}
      <div className="counter-details-view__header">
        <button
          type="button"
          className="counter-details-view__back-btn"
          onClick={onBack}
        >
          ← Back
        </button>

        <div className="counter-details-view__top-actions">
          <button
            type="button"
            className="counter-details-view__action-btn"
            onClick={onOpenFocus}
            title="Open Focus Mode"
          >
            ⛶ Focus Mode
          </button>
          <button
            type="button"
            className="counter-details-view__action-btn"
            onClick={onEdit}
          >
            Edit Counter
          </button>
          {counter.archived ? (
            <button
              type="button"
              className="counter-details-view__action-btn counter-details-view__action-btn--restore"
              onClick={onRestore}
            >
              Restore
            </button>
          ) : (
            <button
              type="button"
              className="counter-details-view__action-btn counter-details-view__action-btn--archive"
              onClick={onArchive}
            >
              Archive
            </button>
          )}
        </div>
      </div>

      {/* Hero Value Section */}
      <div className="counter-details-view__hero">
        <div className="counter-details-view__identity">
          {counter.icon && (
            <span className="counter-details-view__icon">{counter.icon}</span>
          )}
          <h1 className="counter-details-view__name">{counter.name}</h1>
          {counter.archived && (
            <span className="counter-details-view__archived-badge">Archived</span>
          )}
        </div>

        {counter.description && (
          <p className="counter-details-view__desc">{counter.description}</p>
        )}

        <div className="counter-details-view__number-row">
          <span className="counter-details-view__number">
            {counter.currentValue.toLocaleString()}
          </span>
          {counter.unit && (
            <span className="counter-details-view__unit">{counter.unit}</span>
          )}
        </div>

        {hasTarget && (
          <div className="counter-details-view__target-info">
            Target: <strong>{counter.target!.toLocaleString()}</strong>
            {isTargetReached && (
              <span className="counter-details-view__target-badge">
                ✓ Target reached
              </span>
            )}
          </div>
        )}

        {/* Primary Controls */}
        <div className="counter-details-view__controls">
          <button
            type="button"
            className="counter-details-view__btn counter-details-view__btn--dec"
            onClick={onDecrement}
            disabled={isAtZero}
            aria-label={`Subtract ${counter.increment}`}
          >
            −{counter.increment}
          </button>

          <button
            type="button"
            className="counter-details-view__btn counter-details-view__btn--inc"
            onClick={onIncrement}
            aria-label={`Add ${counter.increment}`}
          >
            +{counter.increment}
          </button>

          <button
            type="button"
            className="counter-details-view__btn counter-details-view__btn--undo"
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="Undo last change"
          >
            ↶ Undo
          </button>

          <button
            type="button"
            className="counter-details-view__btn counter-details-view__btn--reset"
            onClick={onReset}
            aria-label="Reset to starting value"
          >
            ↺ Reset
          </button>
        </div>
      </div>

      {/* Configuration Grid */}
      <div className="counter-details-view__config-grid">
        <div className="counter-details-view__config-item">
          <span className="counter-details-view__config-label">Starting value</span>
          <span className="counter-details-view__config-val">
            {counter.startingValue.toLocaleString()}
          </span>
        </div>

        <div className="counter-details-view__config-item">
          <span className="counter-details-view__config-label">Increment amount</span>
          <span className="counter-details-view__config-val">
            +{counter.increment}
          </span>
        </div>

        <div className="counter-details-view__config-item">
          <span className="counter-details-view__config-label">Target</span>
          <span className="counter-details-view__config-val">
            {counter.target !== null ? counter.target.toLocaleString() : "None"}
          </span>
        </div>

        <div className="counter-details-view__config-item">
          <span className="counter-details-view__config-label">Unit</span>
          <span className="counter-details-view__config-val">
            {counter.unit ?? "None"}
          </span>
        </div>
      </div>

      {/* History Log Section */}
      <div className="counter-details-view__history-section">
        <div className="counter-details-view__history-header">
          <h2 className="counter-details-view__history-title">Activity History</h2>
          {counterHistory.length > 0 && (
            <button
              type="button"
              className="counter-details-view__clear-history-btn"
              onClick={() => setIsClearHistoryConfirmOpen(true)}
            >
              Clear History
            </button>
          )}
        </div>

        {counterHistory.length === 0 ? (
          <div className="counter-details-view__empty-history">
            No counting events recorded yet.
          </div>
        ) : (
          <div className="counter-details-view__history-groups">
            {groupedHistory.map((group) => (
              <div key={group.label} className="counter-details-view__history-group">
                <h3 className="counter-details-view__group-label">
                  {group.label}
                </h3>
                <div className="counter-details-view__events-list">
                  {group.events.map((event) => {
                    const timeStr = new Date(event.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    });

                    let badgeLabel = "";
                    let badgeClass = "counter-details-view__event-badge";
                    if (event.type === "increment") {
                      badgeLabel = `+${event.amount}`;
                      badgeClass += " counter-details-view__event-badge--inc";
                    } else if (event.type === "decrement") {
                      badgeLabel = `−${event.amount}`;
                      badgeClass += " counter-details-view__event-badge--dec";
                    } else {
                      badgeLabel = "Reset";
                      badgeClass += " counter-details-view__event-badge--reset";
                    }

                    return (
                      <div key={event.id} className="counter-details-view__event-row">
                        <span className="counter-details-view__event-time">
                          {timeStr}
                        </span>
                        <span className={badgeClass}>{badgeLabel}</span>
                        <span className="counter-details-view__event-transition">
                          {event.previousValue.toLocaleString()} →{" "}
                          <strong>{event.newValue.toLocaleString()}</strong>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {hasMoreHistory && (
              <button
                type="button"
                className="counter-details-view__load-more-btn"
                onClick={() => setDisplayLimit((curr) => curr + PAGE_SIZE)}
              >
                Load older events ({counterHistory.length - displayLimit} remaining)
              </button>
            )}
          </div>
        )}
      </div>

      {/* Clear History Confirmation Modal */}
      <ConfirmModal
        isOpen={isClearHistoryConfirmOpen}
        title="Clear counter history?"
        message={`This will permanently remove all ${counterHistory.length} recorded events for "${counter.name}". The current value will remain ${counter.currentValue.toLocaleString()}. This action cannot be undone.`}
        confirmLabel="Clear History"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={() => {
          onClearHistory();
          setIsClearHistoryConfirmOpen(false);
        }}
        onCancel={() => setIsClearHistoryConfirmOpen(false)}
      />
    </section>
  );
}

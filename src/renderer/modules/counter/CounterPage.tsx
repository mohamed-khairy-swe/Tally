import React, { useEffect, useMemo, useState } from "react";
import type { Counter, CounterSnapshot, CounterSortOption } from "./types";
import { useCounterStore } from "./hooks/useCounterStore";

import {
  decrementCounter,
  incrementCounter,
  resetCounter,
  undoLastOperation,
  clearCounterHistory,
  updateCounterConfig,
} from "./state/counterOperations";
import {
  filterCountersBySearch,
  sortCounters,
} from "./state/counterSorting";

import { CounterCard } from "./components/CounterCard";
import { CounterFormDialog } from "./components/CounterFormDialog";
import { CounterFocusView } from "./components/CounterFocusView";
import { CounterDetailsView } from "./components/CounterDetailsView";
import { CounterSettingsView } from "./components/CounterSettingsView";
import { CounterUndoToast } from "./components/CounterUndoToast";
import { ResetConfirmModal } from "./components/ResetConfirmModal";
import "./CounterPage.css";

type CounterViewMode = "list" | "details" | "focus" | "settings";

interface UndoState {
  message: string;
  counterId: string;
}

export function CounterPage() {
  const { snapshot, replaceSnapshot, persistenceError } = useCounterStore();

  // View routing
  const [viewMode, setViewMode] = useState<CounterViewMode>("list");
  const [activeCounterId, setActiveCounterId] = useState<string | null>(null);

  // Form dialog
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [counterToEdit, setCounterToEdit] = useState<Counter | null>(null);

  // Search & sort
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<CounterSortOption>("manual");

  // Undo toast
  const [undoState, setUndoState] = useState<UndoState | null>(null);

  // Auto-dismiss undo toast after 5 seconds
  useEffect(() => {
    if (!undoState) return;
    const timer = window.setTimeout(() => setUndoState(null), 5000);
    return () => window.clearTimeout(timer);
  }, [undoState]);

  // Reset confirmation modal
  const [counterToReset, setCounterToReset] = useState<Counter | null>(null);

  // Resolve active counter (always reads from snapshot so it stays fresh)
  const activeCounter = useMemo(() => {
    if (!activeCounterId) return null;
    return snapshot.counters.find((c: Counter) => c.id === activeCounterId) ?? null;
  }, [activeCounterId, snapshot.counters]);

  // Whether a given counter has undoable history
  function canUndo(counterId: string) {
    return snapshot.history.some((e) => e.counterId === counterId);
  }

  // --- COUNTER OPERATIONS ---

  function handleIncrement(counter: Counter) {
    const res = incrementCounter(counter, snapshot.history);
    if (!res.success) return;
    replaceSnapshot((curr: CounterSnapshot) => ({
      ...curr,
      counters: curr.counters.map((c: Counter) =>
        c.id === counter.id ? res.counter : c,
      ),
      history: res.history,
    }));
    setUndoState({
      message: `+${res.event!.amount} to ${counter.name}`,
      counterId: counter.id,
    });
  }

  function handleDecrement(counter: Counter) {
    const res = decrementCounter(counter, snapshot.history);
    if (!res.success) return;
    replaceSnapshot((curr: CounterSnapshot) => ({
      ...curr,
      counters: curr.counters.map((c: Counter) =>
        c.id === counter.id ? res.counter : c,
      ),
      history: res.history,
    }));
    setUndoState({
      message: `−${res.event!.amount} from ${counter.name}`,
      counterId: counter.id,
    });
  }

  function handleReset(counter: Counter) {
    if (snapshot.settings.confirmReset) {
      setCounterToReset(counter);
    } else {
      executeReset(counter);
    }
  }

  function executeReset(counter: Counter) {
    const res = resetCounter(counter, snapshot.history);
    replaceSnapshot((curr: CounterSnapshot) => ({
      ...curr,
      counters: curr.counters.map((c: Counter) =>
        c.id === counter.id ? res.counter : c,
      ),
      history: res.history,
    }));
    setUndoState({
      message: `Reset ${counter.name} to ${counter.startingValue}`,
      counterId: counter.id,
    });
    setCounterToReset(null);
  }

  function handleUndo(counter: Counter) {
    const res = undoLastOperation(counter, snapshot.history);
    if (!res.success) return;
    replaceSnapshot((curr: CounterSnapshot) => ({
      ...curr,
      counters: curr.counters.map((c: Counter) =>
        c.id === counter.id ? res.counter : c,
      ),
      history: res.history,
    }));
    setUndoState(null);
  }

  function handleUndoFromToast() {
    if (!undoState) return;
    const counter = snapshot.counters.find((c: Counter) => c.id === undoState.counterId);
    if (counter) handleUndo(counter);
  }

  function handleClearHistory(counter: Counter) {
    replaceSnapshot((curr: CounterSnapshot) => ({
      ...curr,
      history: clearCounterHistory(counter.id, curr.history),
    }));
  }

  // --- CRUD ---

  function handleSaveCounter(savedCounter: Counter) {
    replaceSnapshot((curr: CounterSnapshot) => {
      const existingIdx = curr.counters.findIndex((c: Counter) => c.id === savedCounter.id);
      let updatedCounters: Counter[];
      if (existingIdx === -1) {
        // New counter — append at end with correct displayOrder
        const maxOrder = curr.counters.reduce(
          (max: number, c: Counter) => Math.max(max, c.displayOrder),
          -1,
        );
        updatedCounters = [
          ...curr.counters,
          { ...savedCounter, displayOrder: maxOrder + 1 },
        ];
      } else {
        updatedCounters = curr.counters.map((c: Counter) =>
          c.id === savedCounter.id ? savedCounter : c,
        );
      }
      return { ...curr, counters: updatedCounters };
    });
    setIsFormOpen(false);
    setCounterToEdit(null);
  }

  function handleArchiveCounter(counter: Counter) {
    replaceSnapshot((curr: CounterSnapshot) => ({
      ...curr,
      counters: curr.counters.map((c: Counter) =>
        c.id === counter.id ? updateCounterConfig(c, { archived: true }) : c,
      ),
    }));
    // If we were viewing this counter, go back
    if (activeCounterId === counter.id && viewMode !== "list") {
      setViewMode("list");
    }
  }

  function handleRestoreCounter(counterId: string) {
    replaceSnapshot((curr: CounterSnapshot) => ({
      ...curr,
      counters: curr.counters.map((c: Counter) =>
        c.id === counterId ? updateCounterConfig(c, { archived: false }) : c,
      ),
    }));
  }

  function handleDeletePermanently(counterId: string) {
    replaceSnapshot((curr: CounterSnapshot) => ({
      ...curr,
      counters: curr.counters.filter((c: Counter) => c.id !== counterId),
      history: clearCounterHistory(counterId, curr.history),
    }));
  }

  // --- NAVIGATION ---

  function handleOpenDetails(counter: Counter) {
    setActiveCounterId(counter.id);
    setViewMode("details");
  }

  function handleOpenFocus(counter: Counter) {
    setActiveCounterId(counter.id);
    setViewMode("focus");
  }

  function handleOpenEdit(counter: Counter) {
    setCounterToEdit(counter);
    setIsFormOpen(true);
  }

  function handleBackToList() {
    setViewMode("list");
    setActiveCounterId(null);
  }

  // --- FILTERED / SORTED LIST ---
  const activeCounters = useMemo(
    () => snapshot.counters.filter((c: Counter) => !c.archived),
    [snapshot.counters],
  );

  const displayedCounters = useMemo(() => {
    const filtered = filterCountersBySearch(activeCounters, searchQuery);
    return sortCounters(filtered, sortOption);
  }, [activeCounters, searchQuery, sortOption]);

  // ============================================================
  // RENDER: Focus Mode
  // ============================================================
  if (viewMode === "focus" && activeCounter) {
    return (
      <CounterFocusView
        counter={activeCounter}
        canUndo={canUndo(activeCounter.id)}
        onIncrement={() => handleIncrement(activeCounter)}
        onDecrement={() => handleDecrement(activeCounter)}
        onReset={() => handleReset(activeCounter)}
        onUndo={() => handleUndo(activeCounter)}
        onExit={handleBackToList}
      />
    );
  }

  // ============================================================
  // RENDER: Details / History View
  // ============================================================
  if (viewMode === "details" && activeCounter) {
    return (
      <>
        <CounterDetailsView
          counter={activeCounter}
          history={snapshot.history}
          canUndo={canUndo(activeCounter.id)}
          onIncrement={() => handleIncrement(activeCounter)}
          onDecrement={() => handleDecrement(activeCounter)}
          onReset={() => handleReset(activeCounter)}
          onUndo={() => handleUndo(activeCounter)}
          onClearHistory={() => handleClearHistory(activeCounter)}
          onOpenFocus={() => handleOpenFocus(activeCounter)}
          onEdit={() => handleOpenEdit(activeCounter)}
          onArchive={() => handleArchiveCounter(activeCounter)}
          onRestore={() => handleRestoreCounter(activeCounter.id)}
          onBack={handleBackToList}
        />

        {/* Reset confirm can appear on top of details view */}
        <ResetConfirmModal
          counter={counterToReset}
          onConfirm={() => counterToReset && executeReset(counterToReset)}
          onCancel={() => setCounterToReset(null)}
        />
      </>
    );
  }

  // ============================================================
  // RENDER: Settings View
  // ============================================================
  if (viewMode === "settings") {
    return (
      <CounterSettingsView
        settings={snapshot.settings}
        counters={snapshot.counters}
        onUpdateSettings={(next) =>
          replaceSnapshot((curr: CounterSnapshot) => ({ ...curr, settings: next }))
        }
        onRestoreCounter={handleRestoreCounter}
        onDeletePermanently={handleDeletePermanently}
        onBack={handleBackToList}
      />
    );
  }

  // ============================================================
  // RENDER: Main List View
  // ============================================================
  const hasNoCounters = activeCounters.length === 0;
  const hasNoResults = !hasNoCounters && displayedCounters.length === 0;

  return (
    <div className="counter-page">
      {/* Top Header */}
      <header className="counter-page__header">
        <h1 className="counter-page__title">Counters</h1>
        <div className="counter-page__header-actions">
          <button
            type="button"
            className="counter-page__settings-btn"
            onClick={() => setViewMode("settings")}
            aria-label="Counter Settings"
            title="Settings & Archived Counters"
          >
            ⚙ Settings
          </button>
          <button
            type="button"
            className="counter-page__add-btn"
            onClick={() => {
              setCounterToEdit(null);
              setIsFormOpen(true);
            }}
          >
            + Add Counter
          </button>
        </div>
      </header>

      {/* Persistence Error Banner */}
      {persistenceError && (
        <div className="counter-page__error-banner" role="alert">
          {persistenceError}
        </div>
      )}

      {/* Search & Sort toolbar — only shown when there are counters */}
      {!hasNoCounters && (
        <div className="counter-page__toolbar">
          <div className="counter-page__search-wrap">
            <span className="counter-page__search-icon" aria-hidden="true">
              🔍
            </span>
            <input
              type="search"
              className="counter-page__search-input"
              placeholder="Search counters…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search counters"
            />
            {searchQuery && (
              <button
                type="button"
                className="counter-page__search-clear"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <select
            className="counter-page__sort-select"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as CounterSortOption)}
            aria-label="Sort counters by"
          >
            <option value="manual">Manual Order</option>
            <option value="recentlyUpdated">Recently Updated</option>
            <option value="nameAsc">Name (A–Z)</option>
          </select>
        </div>
      )}

      {/* Counter Cards Grid or Empty States */}
      {hasNoCounters ? (
        <div className="counter-page__empty-state">
          <div className="counter-page__empty-icon">🔢</div>
          <h2 className="counter-page__empty-title">No counters yet</h2>
          <p className="counter-page__empty-desc">
            Create a counter to start tracking anything that can be counted — reps, pages, glasses of water, and more.
          </p>
          <button
            type="button"
            className="counter-page__add-btn"
            onClick={() => {
              setCounterToEdit(null);
              setIsFormOpen(true);
            }}
          >
            + Create Counter
          </button>
        </div>
      ) : hasNoResults ? (
        <div className="counter-page__empty-state">
          <h2 className="counter-page__empty-title">No matching counters</h2>
          <p className="counter-page__empty-desc">
            No counters match "<strong>{searchQuery}</strong>".
          </p>
          <button
            type="button"
            className="counter-page__secondary-btn"
            onClick={() => setSearchQuery("")}
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="counter-page__grid">
          {displayedCounters.map((counter) => (
            <CounterCard
              key={counter.id}
              counter={counter}
              canUndo={canUndo(counter.id)}
              onIncrement={() => handleIncrement(counter)}
              onDecrement={() => handleDecrement(counter)}
              onReset={() => handleReset(counter)}
              onUndo={() => handleUndo(counter)}
              onOpenFocus={() => handleOpenFocus(counter)}
              onOpenDetails={() => handleOpenDetails(counter)}
              onEdit={() => handleOpenEdit(counter)}
              onArchive={() => handleArchiveCounter(counter)}
            />
          ))}
        </div>
      )}

      {/* ---- Modals & Overlays ---- */}

      {/* Create / Edit Form Dialog */}
      {isFormOpen && (
        <CounterFormDialog
          counterToEdit={counterToEdit}
          settings={snapshot.settings}
          onSave={handleSaveCounter}
          onCancel={() => {
            setIsFormOpen(false);
            setCounterToEdit(null);
          }}
        />
      )}

      {/* Reset Confirmation (main list) */}
      <ResetConfirmModal
        counter={counterToReset}
        onConfirm={() => counterToReset && executeReset(counterToReset)}
        onCancel={() => setCounterToReset(null)}
      />

      {/* Undo Toast */}
      {undoState && (
        <CounterUndoToast
          message={undoState.message}
          onUndo={handleUndoFromToast}
          onDismiss={() => setUndoState(null)}
        />
      )}
    </div>
  );
}

export default CounterPage;
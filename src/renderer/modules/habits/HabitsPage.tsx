import React, { useMemo, useState, useEffect } from "react";
import type {
  Habit,
  HabitDate,
  HabitOccurrence,
} from "./types";
import { useHabitsStore } from "./hooks/useHabitsStore";
import { useToday } from "./hooks/useToday";
import {
  createCalendarNavigation,
  goToToday,
  moveSelectedDate,
  selectCalendarDate,
  type CalendarNavigationState,
} from "./state/habitCalendar";
import {
  createCalendarStripDays,
  formatSelectedDateHeading,
} from "./state/habitCalendarStrip";
import {
  completeHabit,
  decrementHabit,
  incrementHabit,
  resetHabit,
} from "./state/habitTracking";
import {
  findOccurrence,
  getOccurrenceConfiguration,
  isOccurrenceScheduled,
  upsertOccurrence,
} from "./state/habitOccurrences";
import { calculateCurrentStreak } from "./state/habitStreaks";

import { HorizontalCalendar } from "./components/HorizontalCalendar";
import { MonthDatePicker } from "./components/MonthDatePicker";
import { HabitCard } from "./components/HabitCard";
import { HabitCategoryFilter } from "./components/HabitCategoryFilter";
import { HabitFormDialog } from "./components/HabitFormDialog";
import { HabitDetailsView } from "./components/HabitDetailsView";
import { HabitSettingsView } from "./components/HabitSettingsView";
import { HabitUndoToast } from "./components/HabitUndoToast";
import "./HabitsPage.css";

type HabitViewMode = "main" | "details" | "settings";

export function HabitsPage() {
  const { snapshot, replaceSnapshot, persistenceError } = useHabitsStore();
  const today = useToday();

  // Navigation state for the 7-day strip
  const [navState, setNavState] = useState<CalendarNavigationState>(() =>
    createCalendarNavigation(today, snapshot.settings.firstDayOfWeek),
  );

  // Synchronize calendar firstDayOfWeek when settings change
  useEffect(() => {
    setNavState((current) =>
      createCalendarNavigation(current.selectedDate, snapshot.settings.firstDayOfWeek),
    );
  }, [snapshot.settings.firstDayOfWeek]);

  // Jump to date popup
  const [isJumpPickerOpen, setIsJumpPickerOpen] = useState(false);

  // Category filter (null = All Categories)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // View mode
  const [viewMode, setViewMode] = useState<HabitViewMode>("main");
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);

  // Form dialog state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState<Habit | null>(null);

  // Undo notification state
  const [undoState, setUndoState] = useState<{
    habitId: string;
    habitName: string;
    date: HabitDate;
    previousProgress: number;
  } | null>(null);

  // Auto-dismiss undo toast after 5 seconds
  useEffect(() => {
    if (!undoState) return;

    const timer = window.setTimeout(() => {
      setUndoState(null);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [undoState]);

  const selectedDate = navState.selectedDate;

  // 7-day strip cells
  const calendarStripDays = useMemo(() => {
    return createCalendarStripDays(navState, today);
  }, [navState, today]);

  // Date Navigation handlers
  function handlePreviousDay() {
    setNavState((curr) => moveSelectedDate(curr, -1));
  }

  function handleNextDay() {
    setNavState((curr) => moveSelectedDate(curr, 1));
  }

  function handleSelectDate(date: HabitDate) {
    setNavState((curr) =>
      selectCalendarDate(curr, date, snapshot.settings.firstDayOfWeek),
    );
  }

  function handleGoToToday() {
    setNavState(goToToday(snapshot.settings.firstDayOfWeek));
  }

  function handleJumpDateSelect(date: HabitDate) {
    setNavState((curr) =>
      selectCalendarDate(curr, date, snapshot.settings.firstDayOfWeek),
    );
    setIsJumpPickerOpen(false);
  }

  // Active habits (non-archived)
  const activeHabits = useMemo(() => {
    return snapshot.habits.filter((h) => !h.archived);
  }, [snapshot.habits]);

  // Category filtered habits
  const categoryFilteredHabits = useMemo(() => {
    if (selectedCategoryId === null) {
      return activeHabits;
    }
    return activeHabits.filter((h) => h.categoryId === selectedCategoryId);
  }, [activeHabits, selectedCategoryId]);

  // Habits scheduled on selected date
  const { incompleteHabits, completedHabits } = useMemo(() => {
    const incomplete: Array<{
      habit: Habit;
      config: ReturnType<typeof getOccurrenceConfiguration>;
      occurrence: HabitOccurrence | null;
      streak: number;
    }> = [];

    const completed: Array<{
      habit: Habit;
      config: ReturnType<typeof getOccurrenceConfiguration>;
      occurrence: HabitOccurrence | null;
      streak: number;
    }> = [];

    for (const habit of categoryFilteredHabits) {
      if (selectedDate < habit.startDate) {
        continue;
      }

      const config = getOccurrenceConfiguration(habit, selectedDate);
      if (!config) continue;

      if (!isOccurrenceScheduled(habit, selectedDate)) {
        continue;
      }

      const occurrence = findOccurrence(snapshot.occurrences, habit.id, selectedDate);
      const streak = calculateCurrentStreak(habit, snapshot.occurrences, today);

      const progress = occurrence?.progress ?? 0;
      const isCompleted =
        config.trackingType === "binary"
          ? progress >= 1
          : progress >= (config.target ?? 1);

      if (isCompleted) {
        completed.push({ habit, config, occurrence, streak });
      } else {
        incomplete.push({ habit, config, occurrence, streak });
      }
    }

    return { incompleteHabits: incomplete, completedHabits: completed };
  }, [categoryFilteredHabits, selectedDate, snapshot.occurrences, today]);

  // Tracking Action Handlers
  function handleToggleBinary(habit: Habit) {
    const existing = findOccurrence(snapshot.occurrences, habit.id, selectedDate);
    const prevProgress = existing?.progress ?? 0;

    let res;
    if (prevProgress >= 1) {
      // Revert / reset
      res = resetHabit(habit, snapshot.occurrences, selectedDate, today);
    } else {
      // Complete
      res = completeHabit(habit, snapshot.occurrences, selectedDate, today);
    }

    if (res.success && res.occurrence) {
      const updatedOccurrences = upsertOccurrence(snapshot.occurrences, res.occurrence);
      replaceSnapshot((curr) => ({
        ...curr,
        occurrences: updatedOccurrences,
      }));

      if (res.occurrence.progress >= 1) {
        setUndoState({
          habitId: habit.id,
          habitName: habit.name,
          date: selectedDate,
          previousProgress: prevProgress,
        });
      } else {
        setUndoState(null);
      }
    }
  }

  function handleIncrementProgressive(habit: Habit) {
    const existing = findOccurrence(snapshot.occurrences, habit.id, selectedDate);
    const prevProgress = existing?.progress ?? 0;

    const res = incrementHabit(habit, snapshot.occurrences, selectedDate, today);
    if (res.success && res.occurrence) {
      const updatedOccurrences = upsertOccurrence(snapshot.occurrences, res.occurrence);
      replaceSnapshot((curr) => ({
        ...curr,
        occurrences: updatedOccurrences,
      }));

      const config = getOccurrenceConfiguration(habit, selectedDate);
      if (config?.target && res.occurrence.progress >= config.target) {
        setUndoState({
          habitId: habit.id,
          habitName: habit.name,
          date: selectedDate,
          previousProgress: prevProgress,
        });
      }
    }
  }

  function handleDecrementProgressive(habit: Habit) {
    const res = decrementHabit(habit, snapshot.occurrences, selectedDate, today);
    if (res.success && res.occurrence) {
      const updatedOccurrences = upsertOccurrence(snapshot.occurrences, res.occurrence);
      replaceSnapshot((curr) => ({
        ...curr,
        occurrences: updatedOccurrences,
      }));
    }
  }

  function handleResetProgressive(habit: Habit) {
    const res = resetHabit(habit, snapshot.occurrences, selectedDate, today);
    if (res.success && res.occurrence) {
      const updatedOccurrences = upsertOccurrence(snapshot.occurrences, res.occurrence);
      replaceSnapshot((curr) => ({
        ...curr,
        occurrences: updatedOccurrences,
      }));
    }
  }

  function handleUndo() {
    if (!undoState) return;
    const { habitId, date, previousProgress } = undoState;

    const occurrence = findOccurrence(snapshot.occurrences, habitId, date);
    if (occurrence) {
      const reverted = {
        ...occurrence,
        progress: previousProgress,
      };
      const updatedOccurrences = upsertOccurrence(snapshot.occurrences, reverted);
      replaceSnapshot((curr) => ({
        ...curr,
        occurrences: updatedOccurrences,
      }));
    }
    setUndoState(null);
  }

  // Habit CRUD handlers
  function handleOpenCreate() {
    setHabitToEdit(null);
    setIsFormOpen(true);
  }

  function handleOpenEdit(habit: Habit) {
    setHabitToEdit(habit);
    setIsFormOpen(true);
  }

  function handleSaveHabit(savedHabit: Habit) {
    replaceSnapshot((curr) => {
      const existingIdx = curr.habits.findIndex((h) => h.id === savedHabit.id);
      let updatedHabits;
      if (existingIdx === -1) {
        updatedHabits = [...curr.habits, savedHabit];
      } else {
        updatedHabits = curr.habits.map((h) =>
          h.id === savedHabit.id ? savedHabit : h,
        );
      }
      return {
        ...curr,
        habits: updatedHabits,
      };
    });
    setIsFormOpen(false);
    setHabitToEdit(null);
  }

  function handleArchiveHabit(habitId: string) {
    replaceSnapshot((curr) => ({
      ...curr,
      habits: curr.habits.map((h) =>
        h.id === habitId ? { ...h, archived: true } : h,
      ),
    }));
    setViewMode("main");
  }

  function handleRestoreHabit(habitId: string) {
    replaceSnapshot((curr) => ({
      ...curr,
      habits: curr.habits.map((h) =>
        h.id === habitId ? { ...h, archived: false } : h,
      ),
    }));
  }

  function handleDeleteHabitPermanently(habitId: string) {
    replaceSnapshot((curr) => ({
      ...curr,
      habits: curr.habits.filter((h) => h.id !== habitId),
      occurrences: curr.occurrences.filter((o) => o.habitId !== habitId),
    }));
  }

  function handleOpenDetails(habitId: string) {
    setSelectedHabitId(habitId);
    setViewMode("details");
  }

  // Selected habit for details view
  const currentDetailHabit = useMemo(() => {
    if (!selectedHabitId) return null;
    return snapshot.habits.find((h) => h.id === selectedHabitId) ?? null;
  }, [selectedHabitId, snapshot.habits]);

  // Selected date heading string
  const selectedDateHeading = useMemo(() => {
    return formatSelectedDateHeading(selectedDate);
  }, [selectedDate]);

  // Render view depending on viewMode
  if (viewMode === "settings") {
    return (
      <HabitSettingsView
        settings={snapshot.settings}
        categories={snapshot.categories}
        habits={snapshot.habits}
        onUpdateSettings={(newSettings) =>
          replaceSnapshot((curr) => ({ ...curr, settings: newSettings }))
        }
        onUpdateCategoriesAndHabits={(updatedCategories, updatedHabits) =>
          replaceSnapshot((curr) => ({
            ...curr,
            categories: updatedCategories,
            habits: updatedHabits,
          }))
        }
        onRestoreHabit={handleRestoreHabit}
        onDeleteHabitPermanently={handleDeleteHabitPermanently}
        onBack={() => setViewMode("main")}
      />
    );
  }

  if (viewMode === "details" && currentDetailHabit) {
    return (
      <>
        <HabitDetailsView
          habit={currentDetailHabit}
          occurrences={snapshot.occurrences}
          categories={snapshot.categories}
          today={today}
          firstDayOfWeek={snapshot.settings.firstDayOfWeek}
          onBack={() => setViewMode("main")}
          onEdit={() => handleOpenEdit(currentDetailHabit)}
          onArchive={() => handleArchiveHabit(currentDetailHabit.id)}
          onRestore={() => handleRestoreHabit(currentDetailHabit.id)}
        />

        {isFormOpen && (
          <HabitFormDialog
            habitToEdit={habitToEdit}
            categories={snapshot.categories}
            today={today}
            settings={snapshot.settings}
            onSave={handleSaveHabit}
            onCancel={() => {
              setIsFormOpen(false);
              setHabitToEdit(null);
            }}
          />
        )}
      </>
    );
  }

  // MAIN TRACKER VIEW
  const hasNoHabitsAtAll = activeHabits.length === 0;
  const hasNoHabitsInCategory =
    selectedCategoryId !== null && categoryFilteredHabits.length === 0;
  const hasNothingScheduled =
    !hasNoHabitsAtAll &&
    !hasNoHabitsInCategory &&
    incompleteHabits.length === 0 &&
    completedHabits.length === 0;

  return (
    <div className="habits-page">
      {/* Top Header Bar */}
      <header className="habits-page__header">
        <h1 className="habits-page__title">Habit Tracker</h1>
        <div className="habits-page__header-actions">
          <button
            type="button"
            className="habits-page__settings-btn"
            onClick={() => setViewMode("settings")}
            title="Settings & Categories"
            aria-label="Habit Settings"
          >
            ⚙ Settings
          </button>
          <button
            type="button"
            className="habits-page__add-habit-btn"
            onClick={handleOpenCreate}
          >
            + Add Habit
          </button>
        </div>
      </header>

      {/* Persistence Error Banner */}
      {persistenceError && (
        <div className="habits-page__error-banner" role="alert">
          {persistenceError}
        </div>
      )}

      {/* Date Navigation & Strip */}
      <section className="habits-page__calendar-section" aria-label="Calendar date navigation">
        <div className="habits-page__calendar-controls">
          <button
            type="button"
            className="habits-page__nav-action-btn"
            onClick={handleGoToToday}
            disabled={selectedDate === today}
            title={selectedDate === today ? "Currently viewing today" : "Go to today"}
          >
            Today
          </button>
          <button
            type="button"
            className="habits-page__nav-action-btn"
            onClick={() => setIsJumpPickerOpen((open) => !open)}
            title="Jump to date"
            aria-expanded={isJumpPickerOpen}
          >
            📅 Jump to date
          </button>
        </div>

        {/* 7-day strip */}
        <HorizontalCalendar
          days={calendarStripDays}
          selectedDate={selectedDate}
          today={today}
          onDateSelect={handleSelectDate}
          onPrevious={handlePreviousDay}
          onNext={handleNextDay}
        />
      </section>

      {/* Selected Date Heading */}
      <div className="habits-page__date-heading-row">
        <h2 className="habits-page__date-heading">{selectedDateHeading}</h2>
        {selectedDate === today && (
          <span className="habits-page__today-badge">Today</span>
        )}
      </div>

      {/* Category Filter */}
      <HabitCategoryFilter
        categories={snapshot.categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
      />

      {/* Habit Lists or Empty States */}
      {hasNoHabitsAtAll ? (
        <div className="habits-page__empty-state">
          <div className="habits-page__empty-icon">🌱</div>
          <h3 className="habits-page__empty-title">No habits yet</h3>
          <p className="habits-page__empty-desc">
            Create a habit and start building your routine.
          </p>
          <button
            type="button"
            className="habits-page__add-habit-btn"
            onClick={handleOpenCreate}
          >
            + Create Habit
          </button>
        </div>
      ) : hasNoHabitsInCategory ? (
        <div className="habits-page__empty-state">
          <h3 className="habits-page__empty-title">No habits in this category</h3>
          <p className="habits-page__empty-desc">
            No habits assigned to this category.
          </p>
          <button
            type="button"
            className="habits-page__nav-action-btn"
            onClick={() => setSelectedCategoryId(null)}
          >
            Clear Filter
          </button>
        </div>
      ) : hasNothingScheduled ? (
        <div className="habits-page__empty-state">
          <div className="habits-page__empty-icon">☕</div>
          <h3 className="habits-page__empty-title">Nothing scheduled</h3>
          <p className="habits-page__empty-desc">
            You have no habits planned for this day.
          </p>
          {selectedDate === today && (
            <button
              type="button"
              className="habits-page__add-habit-btn"
              onClick={handleOpenCreate}
            >
              + Create Habit
            </button>
          )}
        </div>
      ) : (
        <div className="habits-page__lists-container">
          {/* HABITS Section */}
          <section className="habits-page__section" aria-label="Habits to do">
            <h3 className="habits-page__section-title">HABITS</h3>

            {incompleteHabits.length === 0 && completedHabits.length > 0 ? (
              <div className="habits-page__all-done-banner">
                ✨ All done for today.
              </div>
            ) : (
              <div className="habits-page__card-list">
                {incompleteHabits.map(({ habit, config, occurrence, streak }) => {
                  const category =
                    snapshot.categories.find((c) => c.id === habit.categoryId) ?? null;

                  return (
                    <HabitCard
                      key={habit.id}
                      habit={habit}
                      configuration={config!}
                      occurrence={occurrence}
                      category={category}
                      streak={streak}
                      date={selectedDate}
                      today={today}
                      onToggleBinary={() => handleToggleBinary(habit)}
                      onIncrement={() => handleIncrementProgressive(habit)}
                      onDecrement={() => handleDecrementProgressive(habit)}
                      onReset={() => handleResetProgressive(habit)}
                      onClickDetails={() => handleOpenDetails(habit.id)}
                    />
                  );
                })}
              </div>
            )}
          </section>

          {/* COMPLETED Section */}
          {completedHabits.length > 0 && (
            <section className="habits-page__section" aria-label="Completed habits">
              <h3 className="habits-page__section-title">COMPLETED</h3>
              <div className="habits-page__card-list">
                {completedHabits.map(({ habit, config, occurrence, streak }) => {
                  const category =
                    snapshot.categories.find((c) => c.id === habit.categoryId) ?? null;

                  return (
                    <HabitCard
                      key={habit.id}
                      habit={habit}
                      configuration={config!}
                      occurrence={occurrence}
                      category={category}
                      streak={streak}
                      date={selectedDate}
                      today={today}
                      onToggleBinary={() => handleToggleBinary(habit)}
                      onIncrement={() => handleIncrementProgressive(habit)}
                      onDecrement={() => handleDecrementProgressive(habit)}
                      onReset={() => handleResetProgressive(habit)}
                      onClickDetails={() => handleOpenDetails(habit.id)}
                    />
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Jump Date Popover */}
      {isJumpPickerOpen && (
        <MonthDatePicker
          selectedDate={selectedDate}
          today={today}
          firstDayOfWeek={snapshot.settings.firstDayOfWeek}
          onSelect={handleJumpDateSelect}
          onClose={() => setIsJumpPickerOpen(false)}
        />
      )}

      {/* Create / Edit Habit Dialog */}
      {isFormOpen && (
        <HabitFormDialog
          habitToEdit={habitToEdit}
          categories={snapshot.categories}
          today={today}
          settings={snapshot.settings}
          onSave={handleSaveHabit}
          onCancel={() => {
            setIsFormOpen(false);
            setHabitToEdit(null);
          }}
        />
      )}

      {/* Temporary Undo Toast */}
      {undoState && (
        <HabitUndoToast
          habitName={undoState.habitName}
          onUndo={handleUndo}
          onDismiss={() => setUndoState(null)}
        />
      )}
    </div>
  );
}

export default HabitsPage;
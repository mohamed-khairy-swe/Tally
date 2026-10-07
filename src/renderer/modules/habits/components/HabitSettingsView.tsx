import React, { useState } from "react";
import type {
  Habit,
  HabitCategory,
  HabitSettings,
} from "../types";
import {
  createCategory,
  deleteCategory,
  renameCategory,
} from "../state/habitCategories";
import { ConfirmModal } from "./ConfirmModal";
import "./HabitSettingsView.css";

interface HabitSettingsViewProps {
  readonly settings: HabitSettings;
  readonly categories: readonly HabitCategory[];
  readonly habits: readonly Habit[];
  readonly onUpdateSettings: (newSettings: HabitSettings) => void;
  readonly onUpdateCategoriesAndHabits: (
    updatedCategories: HabitCategory[],
    updatedHabits: Habit[],
  ) => void;
  readonly onRestoreHabit: (habitId: string) => void;
  readonly onDeleteHabitPermanently: (habitId: string) => void;
  readonly onBack: () => void;
}

const WEEKDAY_OPTIONS = [
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
] as const;

export function HabitSettingsView({
  settings,
  categories,
  habits,
  onUpdateSettings,
  onUpdateCategoriesAndHabits,
  onRestoreHabit,
  onDeleteHabitPermanently,
  onBack,
}: HabitSettingsViewProps) {
  // Category management state
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCatError, setNewCatError] = useState<string | null>(null);

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [editingCatError, setEditingCatError] = useState<string | null>(null);

  // Confirm delete category
  const [categoryToDelete, setCategoryToDelete] = useState<HabitCategory | null>(null);

  // Confirm permanent delete habit
  const [habitToDeletePermanently, setHabitToDeletePermanently] = useState<Habit | null>(null);

  const archivedHabits = habits.filter((h) => h.archived);

  // Handle adding category
  function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    const res = createCategory(newCategoryName);
    if (!res.category) {
      setNewCatError(res.error ?? "Invalid name");
      return;
    }

    onUpdateCategoriesAndHabits([...categories, res.category], [...habits]);
    setNewCategoryName("");
    setNewCatError(null);
  }

  // Handle renaming category
  function handleSaveRename(category: HabitCategory) {
    const res = renameCategory(category, editingCategoryName);
    if (!res.category) {
      setEditingCatError(res.error ?? "Invalid name");
      return;
    }

    const updatedCategories = categories.map((c) =>
      c.id === category.id ? res.category! : c,
    );
    onUpdateCategoriesAndHabits(updatedCategories, [...habits]);
    setEditingCategoryId(null);
    setEditingCategoryName("");
    setEditingCatError(null);
  }

  // Handle deleting category
  function handleConfirmDeleteCategory() {
    if (!categoryToDelete) return;
    const res = deleteCategory(categoryToDelete.id, categories, habits);
    onUpdateCategoriesAndHabits(res.categories, res.habits);
    setCategoryToDelete(null);
  }

  return (
    <section className="habit-settings-view" aria-label="Habit Tracker Settings">
      <div className="habit-settings-view__header">
        <button
          type="button"
          className="habit-settings-view__back-btn"
          onClick={onBack}
        >
          ← Back to Habits
        </button>
        <h1 className="habit-settings-view__title">Settings</h1>
      </div>

      {/* Calendar Settings */}
      <div className="habit-settings-view__card">
        <h2 className="habit-settings-view__card-title">Calendar</h2>
        <div className="habit-settings-view__field">
          <label htmlFor="first-day-select" className="habit-settings-view__label">
            First day of week
          </label>
          <select
            id="first-day-select"
            className="habit-settings-view__select"
            value={settings.firstDayOfWeek}
            onChange={(e) =>
              onUpdateSettings({
                ...settings,
                firstDayOfWeek: parseInt(e.target.value, 10),
              })
            }
          >
            {WEEKDAY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className="habit-settings-view__hint">
            Controls the presentation of calendar strips, date pickers, and heatmaps.
          </span>
        </div>
      </div>

      {/* Default Heatmap Colors */}
      <div className="habit-settings-view__card">
        <h2 className="habit-settings-view__card-title">Default Habit Colors</h2>
        <p className="habit-settings-view__hint">
          These colors will be used as the default for new habits. Existing habits keep their selected colors.
        </p>

        <div className="habit-settings-view__colors-grid">
          <div className="habit-settings-view__color-field">
            <label className="habit-settings-view__label">
              Default Completed Color
            </label>
            <div className="habit-settings-view__color-row">
              <input
                type="color"
                className="habit-settings-view__color-input"
                value={settings.defaultCompletedColor}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    defaultCompletedColor: e.target.value,
                  })
                }
              />
              <span className="habit-settings-view__color-hex">
                {settings.defaultCompletedColor}
              </span>
            </div>
          </div>

          <div className="habit-settings-view__color-field">
            <label className="habit-settings-view__label">
              Default Partial Progress Color
            </label>
            <div className="habit-settings-view__color-row">
              <input
                type="color"
                className="habit-settings-view__color-input"
                value={settings.defaultPartialColor}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    defaultPartialColor: e.target.value,
                  })
                }
              />
              <span className="habit-settings-view__color-hex">
                {settings.defaultPartialColor}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Management */}
      <div className="habit-settings-view__card">
        <h2 className="habit-settings-view__card-title">Categories</h2>
        <p className="habit-settings-view__hint">
          Deleting a category will unassign it from its habits, leaving the habits Uncategorized. Habits are never deleted.
        </p>

        {/* Add category form */}
        <form className="habit-settings-view__add-category-form" onSubmit={handleAddCategory}>
          <input
            type="text"
            className="habit-settings-view__text-input"
            placeholder="New category name"
            value={newCategoryName}
            maxLength={40}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
          <button
            type="submit"
            className="habit-settings-view__btn habit-settings-view__btn--primary"
            disabled={!newCategoryName.trim()}
          >
            + Add Category
          </button>
        </form>
        {newCatError && (
          <span className="habit-settings-view__error-text">{newCatError}</span>
        )}

        {/* Categories list */}
        <div className="habit-settings-view__categories-list">
          {categories.length === 0 ? (
            <div className="habit-settings-view__empty-text">No categories yet.</div>
          ) : (
            categories.map((cat) => {
              const isEditing = editingCategoryId === cat.id;

              return (
                <div key={cat.id} className="habit-settings-view__category-row">
                  {isEditing ? (
                    <div className="habit-settings-view__category-edit-box">
                      <input
                        type="text"
                        className="habit-settings-view__text-input"
                        value={editingCategoryName}
                        maxLength={40}
                        onChange={(e) => setEditingCategoryName(e.target.value)}
                        autoFocus
                      />
                      <button
                        type="button"
                        className="habit-settings-view__btn habit-settings-view__btn--primary"
                        onClick={() => handleSaveRename(cat)}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="habit-settings-view__btn"
                        onClick={() => {
                          setEditingCategoryId(null);
                          setEditingCategoryName("");
                          setEditingCatError(null);
                        }}
                      >
                        Cancel
                      </button>
                      {editingCatError && (
                        <span className="habit-settings-view__error-text">
                          {editingCatError}
                        </span>
                      )}
                    </div>
                  ) : (
                    <>
                      <span className="habit-settings-view__category-name">
                        {cat.name}
                      </span>
                      <div className="habit-settings-view__category-actions">
                        <button
                          type="button"
                          className="habit-settings-view__action-btn"
                          onClick={() => {
                            setEditingCategoryId(cat.id);
                            setEditingCategoryName(cat.name);
                            setEditingCatError(null);
                          }}
                        >
                          Rename
                        </button>
                        <button
                          type="button"
                          className="habit-settings-view__action-btn habit-settings-view__action-btn--delete"
                          onClick={() => setCategoryToDelete(cat)}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Archived Habits */}
      <div className="habit-settings-view__card">
        <h2 className="habit-settings-view__card-title">Archived Habits</h2>
        <p className="habit-settings-view__hint">
          Archived habits do not appear in your daily schedule, but their history and heatmaps are fully preserved. You can restore them anytime or permanently delete them.
        </p>

        <div className="habit-settings-view__archived-list">
          {archivedHabits.length === 0 ? (
            <div className="habit-settings-view__empty-text">No archived habits.</div>
          ) : (
            archivedHabits.map((habit) => (
              <div key={habit.id} className="habit-settings-view__archived-item">
                <div className="habit-settings-view__archived-info">
                  <span className="habit-settings-view__archived-name">
                    {habit.name}
                  </span>
                  <span className="habit-settings-view__archived-date">
                    Started {habit.startDate}
                  </span>
                </div>
                <div className="habit-settings-view__archived-actions">
                  <button
                    type="button"
                    className="habit-settings-view__btn habit-settings-view__btn--primary"
                    onClick={() => onRestoreHabit(habit.id)}
                  >
                    Restore
                  </button>
                  <button
                    type="button"
                    className="habit-settings-view__btn habit-settings-view__btn--destructive"
                    onClick={() => setHabitToDeletePermanently(habit)}
                  >
                    Delete Permanently
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Category Deletion Confirm Modal */}
      <ConfirmModal
        isOpen={Boolean(categoryToDelete)}
        title="Delete Category?"
        message={`Are you sure you want to delete "${categoryToDelete?.name}"? All habits in this category will become Uncategorized. Habits will not be deleted.`}
        confirmLabel="Delete Category"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmDeleteCategory}
        onCancel={() => setCategoryToDelete(null)}
      />

      {/* Permanent Habit Deletion Confirm Modal */}
      <ConfirmModal
        isOpen={Boolean(habitToDeletePermanently)}
        title="Permanently Delete Habit?"
        message={`Are you sure you want to permanently delete "${habitToDeletePermanently?.name}"? This will permanently erase the habit, its completion records, and its entire heatmap history. This action cannot be undone.`}
        confirmLabel="Delete Permanently"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={() => {
          if (habitToDeletePermanently) {
            onDeleteHabitPermanently(habitToDeletePermanently.id);
            setHabitToDeletePermanently(null);
          }
        }}
        onCancel={() => setHabitToDeletePermanently(null)}
      />
    </section>
  );
}

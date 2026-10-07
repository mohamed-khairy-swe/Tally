import React from "react";
import type { HabitCategory } from "../types";
import "./HabitCategoryFilter.css";

interface HabitCategoryFilterProps {
  readonly categories: readonly HabitCategory[];
  readonly selectedCategoryId: string | null;
  readonly onSelectCategory: (categoryId: string | null) => void;
}

export function HabitCategoryFilter({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: HabitCategoryFilterProps) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <div
      className="habit-category-filter"
      role="radiogroup"
      aria-label="Filter habits by category"
    >
      <button
        type="button"
        role="radio"
        aria-checked={selectedCategoryId === null}
        className={`habit-category-filter__chip ${
          selectedCategoryId === null
            ? "habit-category-filter__chip--active"
            : ""
        }`}
        onClick={() => onSelectCategory(null)}
      >
        All Categories
      </button>

      {categories.map((cat) => {
        const isSelected = selectedCategoryId === cat.id;

        return (
          <button
            key={cat.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            className={`habit-category-filter__chip ${
              isSelected ? "habit-category-filter__chip--active" : ""
            }`}
            onClick={() => onSelectCategory(cat.id)}
            title={cat.name}
          >
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}

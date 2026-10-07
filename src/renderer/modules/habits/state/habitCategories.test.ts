import { describe, expect, it } from "vitest";
import type { Habit, HabitCategory } from "../types";
import {
  createCategory,
  deleteCategory,
  renameCategory,
} from "./habitCategories";

describe("createCategory", () => {
  it("creates a trimmed category", () => {
    const res = createCategory("  Health  ");
    expect(res.category).not.toBeNull();
    expect(res.category?.name).toBe("Health");
    expect(res.error).toBeNull();
  });

  it("rejects empty category names", () => {
    const res = createCategory("    ");
    expect(res.category).toBeNull();
    expect(res.error).toBeDefined();
  });
});

describe("renameCategory", () => {
  it("renames existing category preserving ID", () => {
    const cat: HabitCategory = { id: "cat-1", name: "Fitness" };
    const res = renameCategory(cat, "Sports");
    expect(res.category?.id).toBe("cat-1");
    expect(res.category?.name).toBe("Sports");
  });
});

describe("deleteCategory", () => {
  it("removes category and resets associated habits to null without deleting habits", () => {
    const cat1: HabitCategory = { id: "c1", name: "Health" };
    const cat2: HabitCategory = { id: "c2", name: "Work" };

    const habit1: Habit = {
      id: "h1",
      name: "Run",
      categoryId: "c1",
      startDate: "2026-10-01",
      archived: false,
      completedColor: "#386a20",
      partialColor: "#c47c16",
      configurations: [],
    };

    const habit2: Habit = {
      id: "h2",
      name: "Code",
      categoryId: "c2",
      startDate: "2026-10-01",
      archived: false,
      completedColor: "#386a20",
      partialColor: "#c47c16",
      configurations: [],
    };

    const res = deleteCategory("c1", [cat1, cat2], [habit1, habit2]);

    expect(res.categories).toHaveLength(1);
    expect(res.categories[0].id).toBe("c2");

    expect(res.habits).toHaveLength(2);
    expect(res.habits.find((h) => h.id === "h1")?.categoryId).toBeNull();
    expect(res.habits.find((h) => h.id === "h2")?.categoryId).toBe("c2");
  });
});

import { describe, expect, it } from "vitest";
import type { Counter } from "../types";
import { filterCountersBySearch, sortCounters } from "./counterSorting";

const c1: Counter = {
  id: "1",
  name: "Push-ups",
  description: "Chest workout",
  currentValue: 10,
  startingValue: 0,
  increment: 5,
  target: 50,
  unit: "reps",
  icon: null,
  color: null,
  displayOrder: 2,
  archived: false,
  createdAt: 100,
  updatedAt: 500,
};

const c2: Counter = {
  id: "2",
  name: "Water",
  description: "Hydration daily",
  currentValue: 4,
  startingValue: 0,
  increment: 1,
  target: 8,
  unit: "glasses",
  icon: null,
  color: null,
  displayOrder: 1,
  archived: false,
  createdAt: 200,
  updatedAt: 600,
};

const c3: Counter = {
  id: "3",
  name: "Reading",
  description: "Book chapters",
  currentValue: 12,
  startingValue: 0,
  increment: 1,
  target: null,
  unit: "pages",
  icon: null,
  color: null,
  displayOrder: 3,
  archived: false,
  createdAt: 300,
  updatedAt: 400,
};

const list = [c1, c2, c3];

describe("filterCountersBySearch", () => {
  it("matches name, description, and unit", () => {
    expect(filterCountersBySearch(list, "push")).toHaveLength(1);
    expect(filterCountersBySearch(list, "hydration")).toHaveLength(1);
    expect(filterCountersBySearch(list, "pages")).toHaveLength(1);
    expect(filterCountersBySearch(list, "nonexistent")).toHaveLength(0);
    expect(filterCountersBySearch(list, "")).toHaveLength(3);
  });
});

describe("sortCounters", () => {
  it("sorts by manual displayOrder", () => {
    const sorted = sortCounters(list, "manual");
    expect(sorted.map((c) => c.id)).toEqual(["2", "1", "3"]);
  });

  it("sorts by recentlyUpdated", () => {
    const sorted = sortCounters(list, "recentlyUpdated");
    expect(sorted.map((c) => c.id)).toEqual(["2", "1", "3"]);
  });

  it("sorts by nameAsc", () => {
    const sorted = sortCounters(list, "nameAsc");
    expect(sorted.map((c) => c.name)).toEqual(["Push-ups", "Reading", "Water"]);
  });
});

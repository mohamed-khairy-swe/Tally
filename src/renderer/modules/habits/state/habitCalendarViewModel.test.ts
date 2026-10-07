import { describe, expect, it } from "vitest";
import type { Habit, HabitOccurrence } from "../types";
import {
  createHabitCalendarDay,
  createHabitHeatmap,
} from "./habitCalendarViewModel";

const habit: Habit = {
  id: "h1",
  name: "Study",
  categoryId: null,
  startDate: "2026-10-01",
  archived: false,
  completedColor: "#386a20",
  partialColor: "#c47c16",
  configurations: [
    {
      id: "c1",
      effectiveFrom: "2026-10-01",
      trackingType: "progressive",
      schedule: { type: "daily", weekdays: [], monthDays: [] },
      target: 20,
      increment: 5,
      unit: "mins",
    },
  ],
};

const occurrences: HabitOccurrence[] = [
  {
    habitId: "h1",
    date: "2026-10-05",
    configurationId: "c1",
    progress: 10,
  },
  {
    habitId: "h1",
    date: "2026-10-06",
    configurationId: "c1",
    progress: 20,
  },
];

describe("createHabitCalendarDay", () => {
  it("creates calendar day with partial state and progress ratio", () => {
    const day = createHabitCalendarDay(
      habit,
      occurrences,
      [],
      "2026-10-05",
      "2026-10-07",
    );

    expect(day.scheduled).toBe(true);
    expect(day.editable).toBe(true);
    expect(day.state).toBe("partial");
    expect(day.progress).toBe(10);
    expect(day.target).toBe(20);
  });

  it("creates calendar day with completed state", () => {
    const day = createHabitCalendarDay(
      habit,
      occurrences,
      [],
      "2026-10-06",
      "2026-10-07",
    );

    expect(day.state).toBe("completed");
    expect(day.progress).toBe(20);
  });
});

describe("createHabitHeatmap", () => {
  it("generates date range cells with completion ratios", () => {
    const cells = createHabitHeatmap(
      habit,
      occurrences,
      [],
      "2026-10-01",
      "2026-10-07",
      "2026-10-07",
    );

    expect(cells).toHaveLength(7);

    // 2026-10-05 was partial (10/20)
    const oct5 = cells.find((c) => c.date === "2026-10-05");
    expect(oct5?.state).toBe("partial");
    expect(oct5?.completionRatio).toBe(0.5);

    // 2026-10-06 was completed (20/20)
    const oct6 = cells.find((c) => c.date === "2026-10-06");
    expect(oct6?.state).toBe("completed");
    expect(oct6?.completionRatio).toBe(1);

    // 2026-10-07 is today
    const oct7 = cells.find((c) => c.date === "2026-10-07");
    expect(oct7?.isToday).toBe(true);
  });
});

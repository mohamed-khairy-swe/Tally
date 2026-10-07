import { describe, expect, it } from "vitest";

import type { Habit, HabitOccurrence } from "../types";
import { calculateCurrentStreak } from "./habitStreaks";

const habit: Habit = {
  id: "read",
  name: "Read",
  categoryId: null,
  startDate: "2026-10-01",
  archived: false,
  completedColor: "#386a20",
  partialColor: "#c47c16",
  configurations: [
    {
      id: "config",
      effectiveFrom: "2026-10-01",
      trackingType: "binary",
      schedule: {
        type: "weekly",
        weekdays: [1, 3, 5],
        monthDays: [],
      },
      target: null,
      increment: null,
      unit: null,
    },
  ],
};

function occurrence(date: string): HabitOccurrence {
  return {
    habitId: "read",
    date,
    configurationId: "config",
    progress: 1,
  };
}

describe("calculateCurrentStreak", () => {
  it("counts consecutive scheduled completions", () => {
    const streak = calculateCurrentStreak(
      habit,
      [
        occurrence("2026-10-05"),
        occurrence("2026-10-07"),
      ],
      "2026-10-07",
    );

    expect(streak).toBe(2);
  });

  it("does not break the streak when today is still incomplete", () => {
    const streak = calculateCurrentStreak(
      habit,
      [
        occurrence("2026-10-05"),
        occurrence("2026-10-07"),
      ],
      "2026-10-09",
    );

    expect(streak).toBe(2);
  });

  it("breaks after a missed scheduled day has ended", () => {
    const streak = calculateCurrentStreak(
      habit,
      [occurrence("2026-10-05")],
      "2026-10-08",
    );

    expect(streak).toBe(0);
  });
});

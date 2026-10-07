import { describe, expect, it } from "vitest";
import {
  addHabitConfiguration,
  createHabit,
} from "./habitConfiguration";
import { createHabitConfiguration } from "./habitValidation";

describe("createHabit", () => {
  it("creates a valid habit with initial configuration starting on startDate", () => {
    const config = createHabitConfiguration({
      effectiveFrom: "2026-10-01",
      trackingType: "binary",
      schedule: { type: "daily", weekdays: [], monthDays: [] },
    });

    const res = createHabit({
      name: "Meditation",
      categoryId: null,
      startDate: "2026-10-01",
      completedColor: "#386a20",
      partialColor: "#c47c16",
      configuration: config,
    });

    expect(res.errors).toHaveLength(0);
    expect(res.habit).not.toBeNull();
    expect(res.habit?.name).toBe("Meditation");
    expect(res.habit?.startDate).toBe("2026-10-01");
    expect(res.habit?.configurations).toHaveLength(1);
    expect(res.habit?.configurations[0].effectiveFrom).toBe("2026-10-01");
  });

  it("fails if initial configuration effective date does not match start date", () => {
    const config = createHabitConfiguration({
      effectiveFrom: "2026-10-05",
      trackingType: "binary",
      schedule: { type: "daily", weekdays: [], monthDays: [] },
    });

    const res = createHabit({
      name: "Meditation",
      categoryId: null,
      startDate: "2026-10-01",
      completedColor: "#386a20",
      partialColor: "#c47c16",
      configuration: config,
    });

    expect(res.errors.length).toBeGreaterThan(0);
    expect(res.habit).toBeNull();
  });
});

describe("addHabitConfiguration", () => {
  it("appends new configuration for future date without altering past configuration", () => {
    const initialConfig = createHabitConfiguration({
      effectiveFrom: "2026-10-01",
      trackingType: "binary",
      schedule: { type: "weekly", weekdays: [1, 3, 5], monthDays: [] },
    });

    const createRes = createHabit({
      name: "Workout",
      categoryId: null,
      startDate: "2026-10-01",
      completedColor: "#386a20",
      partialColor: "#c47c16",
      configuration: initialConfig,
    });

    const habit = createRes.habit!;

    const futureConfig = createHabitConfiguration({
      effectiveFrom: "2026-10-08",
      trackingType: "progressive",
      schedule: { type: "weekly", weekdays: [2, 4], monthDays: [] },
      target: 20,
      increment: 5,
    });

    const updateRes = addHabitConfiguration(habit, futureConfig);
    expect(updateRes.errors).toHaveLength(0);
    expect(updateRes.habit?.configurations).toHaveLength(2);

    // Old configuration preserved
    expect(updateRes.habit?.configurations[0].effectiveFrom).toBe("2026-10-01");
    expect(updateRes.habit?.configurations[0].trackingType).toBe("binary");

    // New configuration active from 2026-10-08
    expect(updateRes.habit?.configurations[1].effectiveFrom).toBe("2026-10-08");
    expect(updateRes.habit?.configurations[1].trackingType).toBe("progressive");
  });

  it("replaces existing configuration if effectiveFrom date is identical", () => {
    const config1 = createHabitConfiguration({
      effectiveFrom: "2026-10-01",
      trackingType: "binary",
      schedule: { type: "daily", weekdays: [], monthDays: [] },
    });

    const createRes = createHabit({
      name: "Read",
      categoryId: null,
      startDate: "2026-10-01",
      completedColor: "#386a20",
      partialColor: "#c47c16",
      configuration: config1,
    });

    const habit = createRes.habit!;

    const updatedConfig = createHabitConfiguration({
      effectiveFrom: "2026-10-01",
      trackingType: "progressive",
      schedule: { type: "daily", weekdays: [], monthDays: [] },
      target: 30,
      increment: 5,
    });

    const updateRes = addHabitConfiguration(habit, updatedConfig);
    expect(updateRes.habit?.configurations).toHaveLength(1);
    expect(updateRes.habit?.configurations[0].trackingType).toBe("progressive");
  });
});

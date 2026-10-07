import { describe, expect, it } from "vitest";
import {
  createHabitConfiguration,
  validateHabitName,
  validateProgressiveConfiguration,
  validateSchedule,
} from "./habitValidation";

describe("validateHabitName", () => {
  it("accepts valid non-empty names", () => {
    expect(validateHabitName("Read")).toBeNull();
    expect(validateHabitName("   Exercise   ")).toBeNull();
  });

  it("rejects empty or whitespace-only names", () => {
    expect(validateHabitName("")).not.toBeNull();
    expect(validateHabitName("    ")).not.toBeNull();
  });
});

describe("validateSchedule", () => {
  it("validates weekly schedules require at least one day", () => {
    expect(validateSchedule({ type: "weekly", weekdays: [], monthDays: [] }).valid).toBe(false);
    expect(validateSchedule({ type: "weekly", weekdays: [1, 3], monthDays: [] }).valid).toBe(true);
    expect(validateSchedule({ type: "weekly", weekdays: [7], monthDays: [] }).valid).toBe(false);
  });

  it("validates monthly schedules require at least one day between 1 and 31", () => {
    expect(validateSchedule({ type: "monthly", weekdays: [], monthDays: [] }).valid).toBe(false);
    expect(validateSchedule({ type: "monthly", weekdays: [], monthDays: [1, 15, 31] }).valid).toBe(true);
    expect(validateSchedule({ type: "monthly", weekdays: [], monthDays: [0] }).valid).toBe(false);
    expect(validateSchedule({ type: "monthly", weekdays: [], monthDays: [32] }).valid).toBe(false);
  });
});

describe("validateProgressiveConfiguration", () => {
  it("accepts valid progressive pairs where target is divisible by increment", () => {
    const validConfig = createHabitConfiguration({
      effectiveFrom: "2026-10-01",
      trackingType: "progressive",
      schedule: { type: "daily", weekdays: [], monthDays: [] },
      target: 30,
      increment: 5,
      unit: "pages",
    });

    const res = validateProgressiveConfiguration(validConfig);
    expect(res.valid).toBe(true);
  });

  it("accepts target equal to increment", () => {
    const validConfig = createHabitConfiguration({
      effectiveFrom: "2026-10-01",
      trackingType: "progressive",
      schedule: { type: "daily", weekdays: [], monthDays: [] },
      target: 8,
      increment: 8,
    });

    expect(validateProgressiveConfiguration(validConfig).valid).toBe(true);
  });

  it("rejects increment greater than target", () => {
    const config = createHabitConfiguration({
      effectiveFrom: "2026-10-01",
      trackingType: "progressive",
      schedule: { type: "daily", weekdays: [], monthDays: [] },
      target: 10,
      increment: 20,
    });

    const res = validateProgressiveConfiguration(config);
    expect(res.valid).toBe(false);
    expect(res.errors.increment).toBeDefined();
  });

  it("rejects target not evenly divisible by increment", () => {
    const config = createHabitConfiguration({
      effectiveFrom: "2026-10-01",
      trackingType: "progressive",
      schedule: { type: "daily", weekdays: [], monthDays: [] },
      target: 10,
      increment: 3,
    });

    const res = validateProgressiveConfiguration(config);
    expect(res.valid).toBe(false);
    expect(res.errors.increment).toContain("evenly divisible");
  });

  it("ignores target and increment for binary tracking type", () => {
    const binaryConfig = createHabitConfiguration({
      effectiveFrom: "2026-10-01",
      trackingType: "binary",
      schedule: { type: "daily", weekdays: [], monthDays: [] },
      target: 10,
      increment: 3,
    });

    expect(binaryConfig.target).toBeNull();
    expect(binaryConfig.increment).toBeNull();
    expect(validateProgressiveConfiguration(binaryConfig).valid).toBe(true);
  });
});

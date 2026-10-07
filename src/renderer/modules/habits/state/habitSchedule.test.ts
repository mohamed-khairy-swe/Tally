import { describe, expect, it } from "vitest";
import type { HabitConfiguration } from "../types";
import {
  getConfigurationForDate,
  isHabitScheduledForDate,
  isHabitScheduledOnDate,
} from "./habitSchedule";

describe("isHabitScheduledForDate", () => {
  it("schedules every day for daily habits", () => {
    const config: HabitConfiguration = {
      id: "c1",
      effectiveFrom: "2026-10-01",
      trackingType: "binary",
      schedule: { type: "daily", weekdays: [], monthDays: [] },
      target: null,
      increment: null,
      unit: null,
    };

    expect(isHabitScheduledForDate(config, "2026-10-07")).toBe(true);
    expect(isHabitScheduledForDate(config, "2026-10-08")).toBe(true);
    expect(isHabitScheduledForDate(config, "2026-12-31")).toBe(true);
  });

  it("schedules specific weekdays for weekly habits", () => {
    // Mon (1), Wed (3), Fri (5)
    const config: HabitConfiguration = {
      id: "c1",
      effectiveFrom: "2026-10-01",
      trackingType: "binary",
      schedule: { type: "weekly", weekdays: [1, 3, 5], monthDays: [] },
      target: null,
      increment: null,
      unit: null,
    };

    // 2026-10-05 is Monday
    expect(isHabitScheduledForDate(config, "2026-10-05")).toBe(true);
    // 2026-10-06 is Tuesday
    expect(isHabitScheduledForDate(config, "2026-10-06")).toBe(false);
    // 2026-10-07 is Wednesday
    expect(isHabitScheduledForDate(config, "2026-10-07")).toBe(true);
    // 2026-10-08 is Thursday
    expect(isHabitScheduledForDate(config, "2026-10-08")).toBe(false);
    // 2026-10-09 is Friday
    expect(isHabitScheduledForDate(config, "2026-10-09")).toBe(true);
  });

  it("handles the 31st rule without moving to end of shorter months", () => {
    const config: HabitConfiguration = {
      id: "c1",
      effectiveFrom: "2026-01-01",
      trackingType: "binary",
      schedule: { type: "monthly", weekdays: [], monthDays: [31] },
      target: null,
      increment: null,
      unit: null,
    };

    // January 31 -> scheduled
    expect(isHabitScheduledForDate(config, "2026-01-31")).toBe(true);
    // February 28 -> not scheduled (not moved)
    expect(isHabitScheduledForDate(config, "2026-02-28")).toBe(false);
    // March 31 -> scheduled
    expect(isHabitScheduledForDate(config, "2026-03-31")).toBe(true);
    // April 30 -> not scheduled (not moved)
    expect(isHabitScheduledForDate(config, "2026-04-30")).toBe(false);
    // May 31 -> scheduled
    expect(isHabitScheduledForDate(config, "2026-05-31")).toBe(true);
  });

  it("handles February 29 in leap years vs non-leap years", () => {
    const config: HabitConfiguration = {
      id: "c1",
      effectiveFrom: "2024-01-01",
      trackingType: "binary",
      schedule: { type: "monthly", weekdays: [], monthDays: [29] },
      target: null,
      increment: null,
      unit: null,
    };

    // 2028 is a leap year -> Feb 29 is scheduled
    expect(isHabitScheduledForDate(config, "2028-02-29")).toBe(true);
    // In non-leap years (2026), 2026-02-28 is not the 29th
    expect(isHabitScheduledForDate(config, "2026-02-28")).toBe(false);
  });
});

describe("getConfigurationForDate", () => {
  const config1: HabitConfiguration = {
    id: "c1",
    effectiveFrom: "2026-01-01",
    trackingType: "binary",
    schedule: { type: "weekly", weekdays: [1, 3, 5], monthDays: [] },
    target: null,
    increment: null,
    unit: null,
  };

  const config2: HabitConfiguration = {
    id: "c2",
    effectiveFrom: "2026-10-07",
    trackingType: "progressive",
    schedule: { type: "weekly", weekdays: [2, 4], monthDays: [] },
    target: 30,
    increment: 5,
    unit: "pages",
  };

  const configs = [config1, config2];

  it("returns null before any configuration existed", () => {
    expect(getConfigurationForDate(configs, "2025-12-31")).toBeNull();
  });

  it("uses older configuration for dates before config2 effective date", () => {
    const found = getConfigurationForDate(configs, "2026-05-20");
    expect(found?.id).toBe("c1");
  });

  it("uses newer configuration for dates on or after config2 effective date", () => {
    const foundToday = getConfigurationForDate(configs, "2026-10-07");
    expect(foundToday?.id).toBe("c2");

    const foundFuture = getConfigurationForDate(configs, "2026-11-01");
    expect(foundFuture?.id).toBe("c2");
  });

  it("isHabitScheduledOnDate resolves historical schedules accurately", () => {
    // 2026-10-05 (Monday) was under config1 (Mon, Wed, Fri) -> true
    expect(isHabitScheduledOnDate(configs, "2026-10-05")).toBe(true);
    // 2026-10-06 (Tuesday) was under config1 (Mon, Wed, Fri) -> false
    expect(isHabitScheduledOnDate(configs, "2026-10-06")).toBe(false);
    // 2026-10-08 (Thursday) is under config2 (Tue, Thu) -> true
    expect(isHabitScheduledOnDate(configs, "2026-10-08")).toBe(true);
    // 2026-10-09 (Friday) is under config2 (Tue, Thu) -> false
    expect(isHabitScheduledOnDate(configs, "2026-10-09")).toBe(false);
  });
});

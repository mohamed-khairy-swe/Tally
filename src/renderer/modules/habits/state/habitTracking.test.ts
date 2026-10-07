import { describe, expect, it } from "vitest";
import type { Habit, HabitOccurrence } from "../types";
import {
  completeHabit,
  decrementHabit,
  getHabitDateState,
  incrementHabit,
  resetHabit,
} from "./habitTracking";

const binaryHabit: Habit = {
  id: "h1",
  name: "Exercise",
  categoryId: null,
  startDate: "2026-10-01",
  archived: false,
  completedColor: "#386a20",
  partialColor: "#c47c16",
  configurations: [
    {
      id: "c1",
      effectiveFrom: "2026-10-01",
      trackingType: "binary",
      schedule: { type: "daily", weekdays: [], monthDays: [] },
      target: null,
      increment: null,
      unit: null,
    },
  ],
};

const progressiveHabit: Habit = {
  id: "h2",
  name: "Water",
  categoryId: null,
  startDate: "2026-10-01",
  archived: false,
  completedColor: "#386a20",
  partialColor: "#c47c16",
  configurations: [
    {
      id: "c2",
      effectiveFrom: "2026-10-01",
      trackingType: "progressive",
      schedule: { type: "daily", weekdays: [], monthDays: [] },
      target: 30,
      increment: 5,
      unit: "oz",
    },
  ],
};

const TODAY = "2026-10-07";

describe("completeHabit / resetHabit (Binary)", () => {
  it("completes binary habit today", () => {
    const res = completeHabit(binaryHabit, [], TODAY, TODAY);
    expect(res.success).toBe(true);
    expect(res.occurrence?.progress).toBe(1);
    expect(res.occurrence?.habitId).toBe("h1");
  });

  it("resets binary habit today", () => {
    const existing: HabitOccurrence = {
      habitId: "h1",
      date: TODAY,
      configurationId: "c1",
      progress: 1,
    };

    const res = resetHabit(binaryHabit, [existing], TODAY, TODAY);
    expect(res.success).toBe(true);
    expect(res.occurrence?.progress).toBe(0);
  });

  it("prevents completing future dates", () => {
    const futureDate = "2026-10-08";
    const res = completeHabit(binaryHabit, [], futureDate, TODAY);
    expect(res.success).toBe(false);
    expect(res.error).toBe("future_date");
  });

  it("prevents completing dates before start date", () => {
    const pastDate = "2026-09-30";
    const res = completeHabit(binaryHabit, [], pastDate, TODAY);
    expect(res.success).toBe(false);
    expect(res.error).toBe("before_start");
  });
});

describe("incrementHabit / decrementHabit (Progressive)", () => {
  it("increments progressive habit by increment amount up to target", () => {
    let occurrences: HabitOccurrence[] = [];

    // Press 1: 0 -> 5
    const res1 = incrementHabit(progressiveHabit, occurrences, TODAY, TODAY);
    expect(res1.success).toBe(true);
    expect(res1.occurrence?.progress).toBe(5);
    occurrences = [res1.occurrence!];

    // Press 2: 5 -> 10
    const res2 = incrementHabit(progressiveHabit, occurrences, TODAY, TODAY);
    expect(res2.occurrence?.progress).toBe(10);
    occurrences = [res2.occurrence!];

    // Fast forward to 30
    occurrences = [{ ...occurrences[0], progress: 30 }];
    const resOver = incrementHabit(progressiveHabit, occurrences, TODAY, TODAY);
    expect(resOver.occurrence?.progress).toBe(30); // clamped at 30
  });

  it("decrements progressive habit by increment amount down to 0", () => {
    const initial: HabitOccurrence = {
      habitId: "h2",
      date: TODAY,
      configurationId: "c2",
      progress: 15,
    };

    const res1 = decrementHabit(progressiveHabit, [initial], TODAY, TODAY);
    expect(res1.success).toBe(true);
    expect(res1.occurrence?.progress).toBe(10);

    const atZero: HabitOccurrence = { ...initial, progress: 0 };
    const resZero = decrementHabit(progressiveHabit, [atZero], TODAY, TODAY);
    expect(resZero.occurrence?.progress).toBe(0); // clamped at 0
  });

  it("resets progressive habit to 0", () => {
    const initial: HabitOccurrence = {
      habitId: "h2",
      date: TODAY,
      configurationId: "c2",
      progress: 20,
    };

    const res = resetHabit(progressiveHabit, [initial], TODAY, TODAY);
    expect(res.success).toBe(true);
    expect(res.occurrence?.progress).toBe(0);
  });
});

describe("getHabitDateState", () => {
  it("returns notApplicable before start date", () => {
    const state = getHabitDateState(binaryHabit, [], "2026-09-20", TODAY);
    expect(state.state).toBe("notApplicable");
    expect(state.scheduled).toBe(false);
  });

  it("returns upcoming for future scheduled dates", () => {
    const state = getHabitDateState(binaryHabit, [], "2026-10-15", TODAY);
    expect(state.state).toBe("upcoming");
    expect(state.scheduled).toBe(true);
  });

  it("returns incomplete for scheduled date without record", () => {
    const state = getHabitDateState(binaryHabit, [], TODAY, TODAY);
    expect(state.state).toBe("incomplete");
    expect(state.scheduled).toBe(true);
  });

  it("returns partial for progressive with 0 < progress < target", () => {
    const occurrence: HabitOccurrence = {
      habitId: "h2",
      date: TODAY,
      configurationId: "c2",
      progress: 15,
    };

    const state = getHabitDateState(progressiveHabit, [occurrence], TODAY, TODAY);
    expect(state.state).toBe("partial");
  });

  it("returns completed for progressive with progress == target", () => {
    const occurrence: HabitOccurrence = {
      habitId: "h2",
      date: TODAY,
      configurationId: "c2",
      progress: 30,
    };

    const state = getHabitDateState(progressiveHabit, [occurrence], TODAY, TODAY);
    expect(state.state).toBe("completed");
  });
});

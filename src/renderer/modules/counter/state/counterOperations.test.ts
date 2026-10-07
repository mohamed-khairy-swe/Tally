import { describe, expect, it } from "vitest";
import type { Counter, CounterHistoryEvent } from "../types";
import {
  clearCounterHistory,
  createNewCounter,
  decrementCounter,
  incrementCounter,
  resetCounter,
  undoLastOperation,
  updateCounterConfig,
} from "./counterOperations";
import { MAX_SAFE_COUNTER_VALUE } from "./counterValidation";

const baseCounter: Counter = {
  id: "c-1",
  name: "Push-ups",
  description: "Morning routine",
  currentValue: 20,
  startingValue: 0,
  increment: 5,
  target: 50,
  unit: "reps",
  icon: "💪",
  color: "#386a20",
  displayOrder: 0,
  archived: false,
  createdAt: 1000,
  updatedAt: 1000,
};

describe("createNewCounter", () => {
  it("creates counter with sensible defaults", () => {
    const counter = createNewCounter({ name: "Water" });
    expect(counter.name).toBe("Water");
    expect(counter.currentValue).toBe(0);
    expect(counter.startingValue).toBe(0);
    expect(counter.increment).toBe(1);
    expect(counter.target).toBeNull();
    expect(counter.archived).toBe(false);
  });

  it("sets starting value as current value", () => {
    const counter = createNewCounter({ name: "Laps", startingValue: 10 });
    expect(counter.startingValue).toBe(10);
    expect(counter.currentValue).toBe(10);
  });
});

describe("incrementCounter", () => {
  it("increments by configured increment and creates history event", () => {
    const res = incrementCounter(baseCounter, [], undefined, 2000);
    expect(res.success).toBe(true);
    expect(res.counter.currentValue).toBe(25);
    expect(res.event?.type).toBe("increment");
    expect(res.event?.amount).toBe(5);
    expect(res.event?.previousValue).toBe(20);
    expect(res.event?.newValue).toBe(25);
    expect(res.history).toHaveLength(1);
    expect(res.history[0]).toBe(res.event);
  });

  it("supports custom increment amount", () => {
    const res = incrementCounter(baseCounter, [], 10, 2000);
    expect(res.counter.currentValue).toBe(30);
    expect(res.event?.amount).toBe(10);
  });

  it("allows overshooting the target without clamping", () => {
    const nearTarget = { ...baseCounter, currentValue: 48, target: 50, increment: 5 };
    const res = incrementCounter(nearTarget, []);
    expect(res.counter.currentValue).toBe(53);
    expect(res.event?.newValue).toBe(53);
  });

  it("prevents exceeding MAX_SAFE_COUNTER_VALUE", () => {
    const atMax = { ...baseCounter, currentValue: MAX_SAFE_COUNTER_VALUE };
    const res = incrementCounter(atMax, []);
    expect(res.success).toBe(false);
    expect(res.counter.currentValue).toBe(MAX_SAFE_COUNTER_VALUE);
  });
});

describe("decrementCounter", () => {
  it("decrements by configured increment and creates history event", () => {
    const res = decrementCounter(baseCounter, [], undefined, 2000);
    expect(res.success).toBe(true);
    expect(res.counter.currentValue).toBe(15);
    expect(res.event?.type).toBe("decrement");
    expect(res.event?.amount).toBe(5);
    expect(res.event?.previousValue).toBe(20);
    expect(res.event?.newValue).toBe(15);
  });

  it("clamps at 0 and does not become negative", () => {
    const low = { ...baseCounter, currentValue: 3, increment: 5 };
    const res = decrementCounter(low, []);
    expect(res.success).toBe(true);
    expect(res.counter.currentValue).toBe(0);
    expect(res.event?.amount).toBe(3);
    expect(res.event?.newValue).toBe(0);
  });

  it("rejects decrementing when current value is already zero", () => {
    const zero = { ...baseCounter, currentValue: 0 };
    const res = decrementCounter(zero, []);
    expect(res.success).toBe(false);
    expect(res.counter.currentValue).toBe(0);
    expect(res.event).toBeNull();
  });
});

describe("resetCounter", () => {
  it("resets counter to configured starting value (not necessarily 0)", () => {
    const counterWithStart = { ...baseCounter, currentValue: 45, startingValue: 10 };
    const res = resetCounter(counterWithStart, [], 2000);
    expect(res.success).toBe(true);
    expect(res.counter.currentValue).toBe(10);
    expect(res.event?.type).toBe("reset");
    expect(res.event?.previousValue).toBe(45);
    expect(res.event?.newValue).toBe(10);
  });
});

describe("undoLastOperation", () => {
  it("reverts the most recent operation using its previousValue and pops event from history", () => {
    const event1: CounterHistoryEvent = {
      id: "e-1",
      counterId: "c-1",
      type: "increment",
      amount: 5,
      previousValue: 20,
      newValue: 25,
      timestamp: 1000,
    };
    const event2: CounterHistoryEvent = {
      id: "e-2",
      counterId: "c-1",
      type: "increment",
      amount: 5,
      previousValue: 25,
      newValue: 30,
      timestamp: 2000,
    };

    const counter = { ...baseCounter, currentValue: 30 };
    const history = [event2, event1]; // newest first

    // Undo #1: reverts 30 -> 25
    const undo1 = undoLastOperation(counter, history);
    expect(undo1.success).toBe(true);
    expect(undo1.counter.currentValue).toBe(25);
    expect(undo1.undoneEvent?.id).toBe("e-2");
    expect(undo1.history).toEqual([event1]);

    // Undo #2: reverts 25 -> 20
    const undo2 = undoLastOperation(undo1.counter, undo1.history);
    expect(undo2.success).toBe(true);
    expect(undo2.counter.currentValue).toBe(20);
    expect(undo2.undoneEvent?.id).toBe("e-1");
    expect(undo2.history).toEqual([]);
  });

  it("correctly undoes a reset operation", () => {
    const resetEvent: CounterHistoryEvent = {
      id: "e-reset",
      counterId: "c-1",
      type: "reset",
      amount: 80,
      previousValue: 80,
      newValue: 0,
      timestamp: 3000,
    };

    const counter = { ...baseCounter, currentValue: 0 };
    const undo = undoLastOperation(counter, [resetEvent]);
    expect(undo.success).toBe(true);
    expect(undo.counter.currentValue).toBe(80);
    expect(undo.history).toEqual([]);
  });

  it("returns success false if no history exists for this counter", () => {
    const res = undoLastOperation(baseCounter, []);
    expect(res.success).toBe(false);
    expect(res.counter.currentValue).toBe(20);
  });
});

describe("clearCounterHistory", () => {
  it("removes history for specific counter without affecting others", () => {
    const event1: CounterHistoryEvent = {
      id: "e-1",
      counterId: "c-1",
      type: "increment",
      amount: 1,
      previousValue: 0,
      newValue: 1,
      timestamp: 1000,
    };
    const event2: CounterHistoryEvent = {
      id: "e-2",
      counterId: "c-2",
      type: "increment",
      amount: 1,
      previousValue: 0,
      newValue: 1,
      timestamp: 1000,
    };

    const res = clearCounterHistory("c-1", [event1, event2]);
    expect(res).toEqual([event2]);
  });
});

describe("updateCounterConfig", () => {
  it("updates configuration without modifying currentValue", () => {
    const updated = updateCounterConfig(baseCounter, {
      name: "New Name",
      increment: 10,
      startingValue: 50,
    });

    expect(updated.name).toBe("New Name");
    expect(updated.increment).toBe(10);
    expect(updated.startingValue).toBe(50);
    // Current value preserved!
    expect(updated.currentValue).toBe(baseCounter.currentValue);
  });
});

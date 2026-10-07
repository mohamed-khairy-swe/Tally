import type {
  Counter,
  CounterHistoryEvent,
} from "../types";
import { MAX_SAFE_COUNTER_VALUE } from "./counterValidation";

export interface CreateCounterInput {
  name: string;
  description?: string;
  startingValue?: number;
  increment?: number;
  target?: number | null;
  unit?: string | null;
  icon?: string | null;
  color?: string | null;
}

export function createNewCounter(
  input: CreateCounterInput,
  displayOrder = 0,
  now = Date.now(),
): Counter {
  const startVal = input.startingValue ?? 0;
  return {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    description: (input.description ?? "").trim(),
    currentValue: startVal,
    startingValue: startVal,
    increment: input.increment ?? 1,
    target: input.target ?? null,
    unit: input.unit ? input.unit.trim() : null,
    icon: input.icon ?? null,
    color: input.color ?? null,
    displayOrder,
    archived: false,
    createdAt: now,
    updatedAt: now,
  };
}

export interface OperationResult {
  readonly success: boolean;
  readonly counter: Counter;
  readonly event: CounterHistoryEvent | null;
  readonly history: CounterHistoryEvent[];
}

export function incrementCounter(
  counter: Counter,
  history: readonly CounterHistoryEvent[],
  customAmount?: number,
  now = Date.now(),
): OperationResult {
  const amount = customAmount ?? counter.increment;
  if (amount <= 0) {
    return { success: false, counter, event: null, history: [...history] };
  }

  const previousValue = counter.currentValue;
  if (previousValue >= MAX_SAFE_COUNTER_VALUE) {
    return { success: false, counter, event: null, history: [...history] };
  }

  const newValue = Math.min(MAX_SAFE_COUNTER_VALUE, previousValue + amount);
  const actualAmount = newValue - previousValue;

  const event: CounterHistoryEvent = {
    id: crypto.randomUUID(),
    counterId: counter.id,
    type: "increment",
    amount: actualAmount,
    previousValue,
    newValue,
    timestamp: now,
  };

  const updatedCounter: Counter = {
    ...counter,
    currentValue: newValue,
    updatedAt: now,
  };

  return {
    success: true,
    counter: updatedCounter,
    event,
    history: [event, ...history],
  };
}

export function decrementCounter(
  counter: Counter,
  history: readonly CounterHistoryEvent[],
  customAmount?: number,
  now = Date.now(),
): OperationResult {
  const amount = customAmount ?? counter.increment;
  if (amount <= 0 || counter.currentValue <= 0) {
    return { success: false, counter, event: null, history: [...history] };
  }

  const previousValue = counter.currentValue;
  const newValue = Math.max(0, previousValue - amount);
  const actualAmount = previousValue - newValue;

  const event: CounterHistoryEvent = {
    id: crypto.randomUUID(),
    counterId: counter.id,
    type: "decrement",
    amount: actualAmount,
    previousValue,
    newValue,
    timestamp: now,
  };

  const updatedCounter: Counter = {
    ...counter,
    currentValue: newValue,
    updatedAt: now,
  };

  return {
    success: true,
    counter: updatedCounter,
    event,
    history: [event, ...history],
  };
}

export function resetCounter(
  counter: Counter,
  history: readonly CounterHistoryEvent[],
  now = Date.now(),
): OperationResult {
  const previousValue = counter.currentValue;
  const newValue = counter.startingValue;

  const event: CounterHistoryEvent = {
    id: crypto.randomUUID(),
    counterId: counter.id,
    type: "reset",
    amount: Math.abs(previousValue - newValue),
    previousValue,
    newValue,
    timestamp: now,
  };

  const updatedCounter: Counter = {
    ...counter,
    currentValue: newValue,
    updatedAt: now,
  };

  return {
    success: true,
    counter: updatedCounter,
    event,
    history: [event, ...history],
  };
}

export interface UndoResult {
  readonly success: boolean;
  readonly counter: Counter;
  readonly undoneEvent: CounterHistoryEvent | null;
  readonly history: CounterHistoryEvent[];
}

export function undoLastOperation(
  counter: Counter,
  history: readonly CounterHistoryEvent[],
  now = Date.now(),
): UndoResult {
  // Find the newest event for this counter
  const eventIndex = history.findIndex((e) => e.counterId === counter.id);
  if (eventIndex === -1) {
    return { success: false, counter, undoneEvent: null, history: [...history] };
  }

  const lastEvent = history[eventIndex];
  const updatedHistory = [
    ...history.slice(0, eventIndex),
    ...history.slice(eventIndex + 1),
  ];

  const updatedCounter: Counter = {
    ...counter,
    currentValue: lastEvent.previousValue,
    updatedAt: now,
  };

  return {
    success: true,
    counter: updatedCounter,
    undoneEvent: lastEvent,
    history: updatedHistory,
  };
}

export function clearCounterHistory(
  counterId: string,
  history: readonly CounterHistoryEvent[],
): CounterHistoryEvent[] {
  return history.filter((e) => e.counterId !== counterId);
}

export function updateCounterConfig(
  counter: Counter,
  updates: Partial<
    Pick<
      Counter,
      | "name"
      | "description"
      | "startingValue"
      | "increment"
      | "target"
      | "unit"
      | "icon"
      | "color"
      | "archived"
      | "displayOrder"
    >
  >,
  now = Date.now(),
): Counter {
  return {
    ...counter,
    ...updates,
    updatedAt: now,
  };
}

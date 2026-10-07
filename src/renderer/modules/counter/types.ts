export type CounterOperationType = "increment" | "decrement" | "reset";

export interface CounterHistoryEvent {
  readonly id: string;
  readonly counterId: string;
  readonly type: CounterOperationType;
  readonly amount: number;
  readonly previousValue: number;
  readonly newValue: number;
  readonly timestamp: number; // Unix timestamp in ms
}

export interface Counter {
  readonly id: string;
  name: string;
  description: string;
  currentValue: number;
  startingValue: number;
  increment: number;
  target: number | null;
  unit: string | null;
  icon: string | null;
  color: string | null;
  displayOrder: number;
  archived: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CounterSettings {
  defaultIncrement: number;
  defaultColor: string;
  confirmReset: boolean;
}

export type CounterSortOption = "manual" | "recentlyUpdated" | "nameAsc";

export interface CounterSnapshot {
  counters: Counter[];
  history: CounterHistoryEvent[];
  settings: CounterSettings;
}

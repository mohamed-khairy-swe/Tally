import type {
  Counter,
  CounterHistoryEvent,
  CounterSettings,
  CounterSnapshot,
} from "../types";
import { electronStorage } from "../../../storage/electronStorage";

export const COUNTERS_STORAGE_KEY = "tally.counters.v1";

/** Max history events kept per counter to prevent unbounded growth. */
const MAX_HISTORY_PER_COUNTER = 500;

export const DEFAULT_COUNTER_SETTINGS: CounterSettings = {
  defaultIncrement: 1,
  defaultColor: "#6750a4",
  confirmReset: true,
};

export function createEmptyCounterSnapshot(): CounterSnapshot {
  return {
    counters: [],
    history: [],
    settings: { ...DEFAULT_COUNTER_SETTINGS },
  };
}

/**
 * Keeps only the most recent MAX_HISTORY_PER_COUNTER events for each counter.
 * History is stored newest-first, so we iterate front-to-back and stop once
 * a counter reaches its cap.
 */
export function pruneHistory(
  history: CounterHistoryEvent[],
): CounterHistoryEvent[] {
  const counts = new Map<string, number>();
  const result: CounterHistoryEvent[] = [];
  for (const event of history) {
    const n = counts.get(event.counterId) ?? 0;
    if (n < MAX_HISTORY_PER_COUNTER) {
      result.push(event);
      counts.set(event.counterId, n + 1);
    }
  }
  return result;
}

function isCounterSettings(value: unknown): value is CounterSettings {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const s = value as CounterSettings;
  return (
    Number.isInteger(s.defaultIncrement) &&
    s.defaultIncrement > 0 &&
    typeof s.defaultColor === "string" &&
    typeof s.confirmReset === "boolean"
  );
}

function isCounterSnapshot(value: unknown): value is CounterSnapshot {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const s = value as CounterSnapshot;
  return (
    Array.isArray(s.counters) &&
    Array.isArray(s.history) &&
    isCounterSettings(s.settings)
  );
}

export function loadCounterSnapshot(
  storage: Pick<Storage, "getItem"> = electronStorage,
): CounterSnapshot {
  try {
    const raw = storage.getItem(COUNTERS_STORAGE_KEY);
    if (raw === null) {
      return createEmptyCounterSnapshot();
    }

    const parsed: unknown = JSON.parse(raw);
    if (!isCounterSnapshot(parsed)) {
      return createEmptyCounterSnapshot();
    }

    return parsed;
  } catch {
    return createEmptyCounterSnapshot();
  }
}

export function saveCounterSnapshot(
  snapshot: CounterSnapshot,
  storage: Pick<Storage, "setItem"> = electronStorage,
): void {
  // Prune history before writing to keep the stored size bounded
  const safe: CounterSnapshot = {
    ...snapshot,
    history: pruneHistory(snapshot.history),
  };
  storage.setItem(COUNTERS_STORAGE_KEY, JSON.stringify(safe));
}

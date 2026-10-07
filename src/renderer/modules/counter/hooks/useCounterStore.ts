import { useCallback, useState } from "react";
import type { CounterSnapshot } from "../types";
import {
  loadCounterSnapshot,
  saveCounterSnapshot,
} from "../state/counterStore";

export function useCounterStore() {
  const [snapshot, setSnapshot] = useState<CounterSnapshot>(loadCounterSnapshot);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);

  const replaceSnapshot = useCallback(
    (updater: (current: CounterSnapshot) => CounterSnapshot) => {
      setSnapshot((current: CounterSnapshot) => {
        const next = updater(current);
        try {
          saveCounterSnapshot(next);
          setPersistenceError(null);
          return next;
        } catch {
          setPersistenceError(
            "Could not save counter data. The last action was not stored.",
          );
          return current;
        }
      });
    },
    [],
  );

  return {
    snapshot,
    persistenceError,
    replaceSnapshot,
  };
}

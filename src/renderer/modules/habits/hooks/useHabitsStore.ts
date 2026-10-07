import { useCallback, useState } from "react";

import {
  loadHabitsSnapshot,
  saveHabitsSnapshot,
  type HabitsSnapshot,
} from "../state/habitStore";

export function useHabitsStore() {
  const [snapshot, setSnapshot] = useState<HabitsSnapshot>(
    loadHabitsSnapshot,
  );
  const [persistenceError, setPersistenceError] = useState<string | null>(
    null,
  );

  const replaceSnapshot = useCallback(
    (updater: (current: HabitsSnapshot) => HabitsSnapshot) => {
      setSnapshot((current) => {
        const next = updater(current);

        try {
          saveHabitsSnapshot(next);
          setPersistenceError(null);
          return next;
        } catch {
          setPersistenceError(
            "Could not save habit data. The last action was not stored.",
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

/**
 * electronStorage.ts
 *
 * A renderer-side storage adapter that talks to the main process via the
 * window.tally.store IPC bridge, with automatic fallback and migration.
 *
 * WHY THIS EXISTS
 * ---------------
 * electron-store lives in the main process. The renderer cannot import it
 * directly (different process, no Node.js access). So we route all reads and
 * writes through IPC handlers registered in main.ts.
 *
 * DESIGN — SYNC READS, ASYNC WRITES, FALLBACK & AUTO-MIGRATION
 * -------------------------------------------------------------
 * 1. Synchronous reads: At app startup, `preloadElectronStorage()` populates
 *    an in-memory cache so React initializers can read immediately.
 * 2. Asynchronous writes: `setItem(key, value)` updates the cache synchronously
 *    and writes to disk via IPC in the background.
 * 3. Graceful fallback: If running outside Electron (e.g. browser dev or tests),
 *    it gracefully falls back to `window.localStorage`.
 * 4. Zero-loss migration: If electron-store has no value for a key but
 *    `localStorage` has existing data from prior versions, it automatically
 *    migrates that data into electron-store on first launch.
 */

// All keys managed by Tally — preloaded at startup.
export const TALLY_STORAGE_KEYS = [
  "tally.habits.v1",
  "tally.counters.v1",
  "tally.pomodoro.v1",
] as const;

// In-memory cache populated by preloadElectronStorage()
const cache = new Map<string, string | null>();

/**
 * Returns true if the IPC bridge to electron-store is available in the current environment.
 */
function hasElectronStoreBridge(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.tally !== "undefined" &&
    typeof window.tally.store !== "undefined" &&
    typeof window.tally.store.get === "function" &&
    typeof window.tally.store.set === "function"
  );
}

/**
 * Returns true if browser localStorage is accessible.
 */
function hasLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/**
 * Call this once at app startup (before rendering) to populate the in-memory cache.
 * Awaiting it guarantees that all subsequent getItem() calls are served synchronously.
 */
export async function preloadElectronStorage(): Promise<void> {
  const isElectron = hasElectronStoreBridge();

  if (!isElectron) {
    // Web / Test fallback: populate cache directly from localStorage
    if (hasLocalStorage()) {
      for (const key of TALLY_STORAGE_KEYS) {
        try {
          cache.set(key, window.localStorage.getItem(key));
        } catch {
          cache.set(key, null);
        }
      }
    }
    return;
  }

  // Running in Electron: fetch from electron-store via IPC
  const results = await Promise.all(
    TALLY_STORAGE_KEYS.map(async (key) => {
      try {
        let value = await window.tally.store.get(key);

        // Auto-migration: if electron-store is empty for this key, check legacy localStorage
        if (value === null && hasLocalStorage()) {
          try {
            const legacyValue = window.localStorage.getItem(key);
            if (legacyValue !== null) {
              value = legacyValue;
              // Persist into electron-store so future loads have it
              await window.tally.store.set(key, legacyValue);
            }
          } catch {
            // Ignore legacy localStorage read errors
          }
        }

        return { key, value };
      } catch (err) {
        console.warn(`[electronStorage] Failed to preload key "${key}":`, err);
        return { key, value: null };
      }
    }),
  );

  for (const { key, value } of results) {
    cache.set(key, value);
  }
}

/**
 * A storage adapter that satisfies Pick<Storage, "getItem" | "setItem">.
 * Pass this to loadHabitsSnapshot(), loadCounterSnapshot(), etc.
 */
export const electronStorage: Pick<Storage, "getItem" | "setItem"> = {
  getItem(key: string): string | null {
    if (cache.has(key)) {
      return cache.get(key) ?? null;
    }

    // Fallback if key wasn't in TALLY_STORAGE_KEYS
    if (hasLocalStorage()) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    }

    return null;
  },

  setItem(key: string, value: string): void {
    // 1. Update in-memory cache synchronously
    cache.set(key, value);

    // 2. Persist to electron-store if available
    if (hasElectronStoreBridge()) {
      void window.tally.store.set(key, value).catch((err) => {
        console.error(`[electronStorage] Failed to write key "${key}" to electron-store:`, err);
      });
    }

    // 3. Also write to localStorage for fallback/safety
    if (hasLocalStorage()) {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // Ignore quota/access errors if electron-store is the primary
      }
    }
  },
};

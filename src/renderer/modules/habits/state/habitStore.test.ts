import { describe, expect, it } from "vitest";
import type { HabitsSnapshot } from "./habitStore";
import {
  createEmptyHabitsSnapshot,
  DEFAULT_HABIT_SETTINGS,
  HABITS_STORAGE_KEY,
  loadHabitsSnapshot,
  saveHabitsSnapshot,
} from "./habitStore";

class MemoryStorage implements Pick<Storage, "getItem" | "setItem"> {
  private data = new Map<string, string>();

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

describe("habitStore", () => {
  it("creates empty snapshot with defaults", () => {
    const snapshot = createEmptyHabitsSnapshot();
    expect(snapshot.habits).toEqual([]);
    expect(snapshot.categories).toEqual([]);
    expect(snapshot.occurrences).toEqual([]);
    expect(snapshot.settings).toEqual(DEFAULT_HABIT_SETTINGS);
  });

  describe("loadHabitsSnapshot & saveHabitsSnapshot", () => {
    it("returns empty snapshot when storage is empty", () => {
      const storage = new MemoryStorage();
      const snapshot = loadHabitsSnapshot(storage);
      expect(snapshot.habits).toEqual([]);
      expect(snapshot.categories).toEqual([]);
    });

    it("returns empty snapshot when storage contains invalid JSON", () => {
      const storage = new MemoryStorage();
      storage.setItem(HABITS_STORAGE_KEY, "invalid-json");
      const snapshot = loadHabitsSnapshot(storage);
      expect(snapshot.habits).toEqual([]);
    });

    it("saves and loads valid snapshot", () => {
      const storage = new MemoryStorage();
      const testSnapshot: HabitsSnapshot = {
        habits: [
          {
            id: "h1",
            name: "Morning Walk",
            categoryId: null,
            startDate: "2026-10-01",
            archived: false,
            completedColor: "#386a20",
            partialColor: "#c47c16",
            configurations: [
              {
                id: "cfg1",
                effectiveFrom: "2026-10-01",
                trackingType: "binary",
                schedule: { type: "daily", weekdays: [], monthDays: [] },
                target: null,
                increment: null,
                unit: null,
              },
            ],
          },
        ],
        categories: [
          {
            id: "cat1",
            name: "Health",
          },
        ],
        occurrences: [],
        settings: {
          firstDayOfWeek: 0,
          defaultCompletedColor: "#386a20",
          defaultPartialColor: "#c47c16",
        },
      };

      saveHabitsSnapshot(testSnapshot, storage);
      const loaded = loadHabitsSnapshot(storage);
      expect(loaded).toEqual(testSnapshot);
    });
  });
});

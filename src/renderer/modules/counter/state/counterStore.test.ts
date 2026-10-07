import { describe, expect, it } from "vitest";
import type { CounterHistoryEvent, CounterSnapshot } from "../types";
import {
  COUNTERS_STORAGE_KEY,
  createEmptyCounterSnapshot,
  DEFAULT_COUNTER_SETTINGS,
  loadCounterSnapshot,
  pruneHistory,
  saveCounterSnapshot,
} from "./counterStore";

class MemoryStorage implements Pick<Storage, "getItem" | "setItem"> {
  private data = new Map<string, string>();

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

describe("counterStore", () => {
  it("creates empty snapshot with defaults", () => {
    const snapshot = createEmptyCounterSnapshot();
    expect(snapshot.counters).toEqual([]);
    expect(snapshot.history).toEqual([]);
    expect(snapshot.settings).toEqual(DEFAULT_COUNTER_SETTINGS);
  });

  describe("pruneHistory", () => {
    it("caps history at 500 events per counter", () => {
      const history: CounterHistoryEvent[] = [];
      // 600 events for c1, 50 events for c2
      for (let i = 0; i < 600; i++) {
        history.push({
          id: `e-c1-${i}`,
          counterId: "c1",
          type: "increment",
          amount: 1,
          previousValue: i,
          newValue: i + 1,
          timestamp: Date.now() - i * 1000,
        });
      }
      for (let i = 0; i < 50; i++) {
        history.push({
          id: `e-c2-${i}`,
          counterId: "c2",
          type: "increment",
          amount: 1,
          previousValue: i,
          newValue: i + 1,
          timestamp: Date.now() - i * 1000,
        });
      }

      const pruned = pruneHistory(history);
      const c1Count = pruned.filter((e) => e.counterId === "c1").length;
      const c2Count = pruned.filter((e) => e.counterId === "c2").length;

      expect(c1Count).toBe(500);
      expect(c2Count).toBe(50);
      expect(pruned.length).toBe(550);
    });
  });

  describe("loadCounterSnapshot & saveCounterSnapshot", () => {
    it("returns empty snapshot when storage is empty", () => {
      const storage = new MemoryStorage();
      const snapshot = loadCounterSnapshot(storage);
      expect(snapshot.counters).toEqual([]);
      expect(snapshot.history).toEqual([]);
    });

    it("returns empty snapshot when storage has corrupt JSON", () => {
      const storage = new MemoryStorage();
      storage.setItem(COUNTERS_STORAGE_KEY, "{corrupt-json");
      const snapshot = loadCounterSnapshot(storage);
      expect(snapshot.counters).toEqual([]);
    });

    it("saves and loads a valid snapshot", () => {
      const storage = new MemoryStorage();
      const testSnapshot: CounterSnapshot = {
        counters: [
          {
            id: "c1",
            name: "Test",
            description: "",
            currentValue: 10,
            startingValue: 0,
            increment: 1,
            target: 20,
            unit: null,
            icon: null,
            color: null,
            displayOrder: 0,
            archived: false,
            createdAt: 1000,
            updatedAt: 1000,
          },
        ],
        history: [],
        settings: {
          defaultIncrement: 2,
          defaultColor: "#123456",
          confirmReset: false,
        },
      };

      saveCounterSnapshot(testSnapshot, storage);
      const loaded = loadCounterSnapshot(storage);
      expect(loaded).toEqual(testSnapshot);
    });
  });
});

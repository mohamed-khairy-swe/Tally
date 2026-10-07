import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  electronStorage,
  preloadElectronStorage,
  TALLY_STORAGE_KEYS,
} from "./electronStorage";

class MockLocalStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

describe("electronStorage", () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    const mockStorage = new MockLocalStorage();
    // Setup mock window environment on globalThis
    (globalThis as unknown as { window: unknown }).window = {
      localStorage: mockStorage,
    };
  });

  afterEach(() => {
    globalThis.window = originalWindow;
  });

  it("populates cache from localStorage when window.tally is unavailable", async () => {
    window.localStorage.setItem(TALLY_STORAGE_KEYS[0], '{"habits":[]}');

    await preloadElectronStorage();

    expect(electronStorage.getItem(TALLY_STORAGE_KEYS[0])).toBe('{"habits":[]}');
    expect(electronStorage.getItem("unknown_key")).toBeNull();
  });

  it("writes to both in-memory cache and localStorage when window.tally is unavailable", () => {
    electronStorage.setItem("test.key", "test.value");

    expect(electronStorage.getItem("test.key")).toBe("test.value");
    expect(window.localStorage.getItem("test.key")).toBe("test.value");
  });

  it("loads from window.tally.store when available", async () => {
    const mockStore = {
      get: vi.fn(async (key: string) => {
        if (key === TALLY_STORAGE_KEYS[1]) return '{"counters":[1]}';
        return null;
      }),
      set: vi.fn(async () => {}),
    };

    (window as unknown as { tally: unknown }).tally = {
      platform: "linux",
      store: mockStore,
    };

    await preloadElectronStorage();

    expect(electronStorage.getItem(TALLY_STORAGE_KEYS[1])).toBe('{"counters":[1]}');
    expect(mockStore.get).toHaveBeenCalledWith(TALLY_STORAGE_KEYS[1]);
  });

  it("auto-migrates legacy localStorage data into window.tally.store", async () => {
    window.localStorage.setItem(TALLY_STORAGE_KEYS[0], '{"legacy":"data"}');

    const mockStore = {
      get: vi.fn(async () => null),
      set: vi.fn(async () => {}),
    };

    (window as unknown as { tally: unknown }).tally = {
      platform: "linux",
      store: mockStore,
    };

    await preloadElectronStorage();

    expect(mockStore.set).toHaveBeenCalledWith(
      TALLY_STORAGE_KEYS[0],
      '{"legacy":"data"}',
    );
    expect(electronStorage.getItem(TALLY_STORAGE_KEYS[0])).toBe('{"legacy":"data"}');
  });

  it("calls window.tally.store.set and updates cache on setItem", () => {
    const mockStore = {
      get: vi.fn(async () => null),
      set: vi.fn(async () => {}),
    };

    (window as unknown as { tally: unknown }).tally = {
      platform: "linux",
      store: mockStore,
    };

    electronStorage.setItem(TALLY_STORAGE_KEYS[0], "new-value");

    expect(electronStorage.getItem(TALLY_STORAGE_KEYS[0])).toBe("new-value");
    expect(mockStore.set).toHaveBeenCalledWith(TALLY_STORAGE_KEYS[0], "new-value");
  });
});

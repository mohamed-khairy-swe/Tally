import { describe, expect, it } from "vitest";
import {
  INITIAL_POMODORO_SETTINGS_STATE,
  type PomodoroSettingsState,
} from "./pomodoroSettings";
import {
  loadPomodoroSettingsState,
  POMODORO_STORAGE_KEY,
  savePomodoroSettingsState,
} from "./pomodoroStore";

class MemoryStorage implements Pick<Storage, "getItem" | "setItem"> {
  private data = new Map<string, string>();

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

describe("pomodoroStore", () => {
  it("returns default state when storage is empty", () => {
    const storage = new MemoryStorage();
    const state = loadPomodoroSettingsState(storage);
    expect(state).toEqual(INITIAL_POMODORO_SETTINGS_STATE);
  });

  it("returns default state when storage has invalid JSON", () => {
    const storage = new MemoryStorage();
    storage.setItem(POMODORO_STORAGE_KEY, "{corrupt-data");
    const state = loadPomodoroSettingsState(storage);
    expect(state).toEqual(INITIAL_POMODORO_SETTINGS_STATE);
  });

  it("fixes activeProfileId when it points to a deleted or non-existent profile", () => {
    const storage = new MemoryStorage();
    const stateWithOrphanId: PomodoroSettingsState = {
      profiles: [
        {
          id: "p1",
          name: "Work",
          focusMinutes: 25,
          shortBreakMinutes: 5,
          longBreakMinutes: 15,
          sessionLength: 4,
          autoStartNextTimer: false,
          longBreakAfterSession: 4,
        },
      ],
      activeProfileId: "non-existent-id",
    };

    savePomodoroSettingsState(stateWithOrphanId, storage);
    const loaded = loadPomodoroSettingsState(storage);
    expect(loaded.activeProfileId).toBe("p1");
  });

  it("saves and loads valid pomodoro settings", () => {
    const storage = new MemoryStorage();
    const customState: PomodoroSettingsState = {
      profiles: [
        {
          id: "custom-1",
          name: "Deep Focus",
          focusMinutes: 50,
          shortBreakMinutes: 10,
          longBreakMinutes: 20,
          sessionLength: 3,
          autoStartNextTimer: true,
          longBreakAfterSession: 3,
        },
      ],
      activeProfileId: "custom-1",
    };

    savePomodoroSettingsState(customState, storage);
    const loaded = loadPomodoroSettingsState(storage);
    expect(loaded).toEqual(customState);
  });
});

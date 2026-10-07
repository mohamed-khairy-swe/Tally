import { describe, expect, it } from "vitest";

import {
  buildPomodoroSequence,
  getNextSequenceIndex,
  getPreviousSequenceIndex,
} from "./pomodoroSequence";
import type {
  PomodoroSettingsProfile,
  PomodoroTimerType,
} from "../types";

const baseSettings: PomodoroSettingsProfile = {
  id: "test",
  name: "Test",

  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,

  sessionLength: 4,
  autoStartNextTimer: false,

  longBreakAfterSession: 4,
};

const SYMBOLS: Record<PomodoroTimerType, string> = {
  focus: "F",
  shortBreak: "S",
  longBreak: "L",
};

function withSettings(
  overrides: Partial<PomodoroSettingsProfile>,
): PomodoroSettingsProfile {
  return { ...baseSettings, ...overrides };
}

// F = Focus, S = Short Break, L = Long Break, number = Focus session number.
function toTimeline(settings: PomodoroSettingsProfile): string {
  return buildPomodoroSequence(settings)
    .map((item) => `${SYMBOLS[item.type]}${item.sessionNumber}`)
    .join(" ");
}

describe("buildPomodoroSequence", () => {
  it("builds the default cycle", () => {
    expect(toTimeline(baseSettings)).toBe("F1 S1 F2 S2 F3 S3 F4 L4");
  });

  it("uses a long break only after the specified session and short breaks for the rest", () => {
    expect(toTimeline(withSettings({ longBreakAfterSession: 2 }))).toBe(
      "F1 S1 F2 L2 F3 S3 F4 S4",
    );
  });

  it("places a single long break at the specified session in longer cycles", () => {
    expect(
      toTimeline(withSettings({ sessionLength: 6, longBreakAfterSession: 4 })),
    ).toBe("F1 S1 F2 S2 F3 S3 F4 L4 F5 S5 F6 S6");
  });

  it("places long break after session 1 and short breaks after subsequent sessions", () => {
    expect(
      toTimeline(withSettings({ sessionLength: 3, longBreakAfterSession: 1 })),
    ).toBe("F1 L1 F2 S2 F3 S3");
  });

  it("still places a single long break when the short break is 0", () => {
    expect(
      toTimeline(withSettings({ shortBreakMinutes: 0, longBreakAfterSession: 2 })),
    ).toBe("F1 F2 L2 F3 F4");
  });

  it("has no long breaks when the long break is 0", () => {
    expect(
      toTimeline(
        withSettings({ longBreakMinutes: 0, longBreakAfterSession: null }),
      ),
    ).toBe("F1 S1 F2 S2 F3 S3 F4 S4");
  });

  it("has only focus sessions when both breaks are 0", () => {
    expect(
      toTimeline(
        withSettings({
          shortBreakMinutes: 0,
          longBreakMinutes: 0,
          longBreakAfterSession: null,
        }),
      ),
    ).toBe("F1 F2 F3 F4");
  });

  it("handles a single-session cycle", () => {
    expect(
      toTimeline(withSettings({ sessionLength: 1, longBreakAfterSession: 1 })),
    ).toBe("F1 L1");
  });

  it("numbers items sequentially from zero", () => {
    const sequence = buildPomodoroSequence(baseSettings);

    expect(sequence.map((item) => item.index)).toEqual(
      sequence.map((_, position) => position),
    );
  });
});

describe("sequence navigation", () => {
  it("moves forward and wraps to the start", () => {
    expect(getNextSequenceIndex(0, 8)).toBe(1);
    expect(getNextSequenceIndex(7, 8)).toBe(0);
  });

  it("moves backward and wraps to the end", () => {
    expect(getPreviousSequenceIndex(3, 8)).toBe(2);
    expect(getPreviousSequenceIndex(0, 8)).toBe(7);
  });

  it("returns 0 for an empty sequence", () => {
    expect(getNextSequenceIndex(0, 0)).toBe(0);
    expect(getPreviousSequenceIndex(0, 0)).toBe(0);
  });
});

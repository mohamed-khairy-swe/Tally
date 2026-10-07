import { describe, expect, it } from "vitest";

import {
  createCalendarNavigation,
  moveSelectedDate,
  selectCalendarDate,
} from "./habitCalendar";

describe("habit calendar navigation", () => {
  it("starts on the week that contains the selected date", () => {
    const state = createCalendarNavigation("2026-10-07", 1);

    expect(state.selectedDate).toBe("2026-10-07");
    expect(state.visibleStartDate).toBe("2026-10-05");
    expect(state.visibleEndDate).toBe("2026-10-11");
  });

  it("keeps the seven-day window still while moving inside it", () => {
    const start = createCalendarNavigation("2026-10-08", 1);
    const next = moveSelectedDate(start, 1);

    expect(next.selectedDate).toBe("2026-10-09");
    expect(next.visibleStartDate).toBe("2026-10-05");
    expect(next.visibleEndDate).toBe("2026-10-11");
  });

  it("shifts the window by one day when leaving the edge", () => {
    const sunday = createCalendarNavigation("2026-10-11", 1);
    const next = moveSelectedDate(sunday, 1);

    expect(next.selectedDate).toBe("2026-10-12");
    expect(next.visibleStartDate).toBe("2026-10-06");
    expect(next.visibleEndDate).toBe("2026-10-12");
  });

  it("jumps to the week containing a distant date", () => {
    const state = createCalendarNavigation("2026-10-07", 1);
    const jumped = selectCalendarDate(state, "2026-01-15", 1);

    expect(jumped.selectedDate).toBe("2026-01-15");
    expect(jumped.visibleStartDate).toBe("2026-01-12");
    expect(jumped.visibleEndDate).toBe("2026-01-18");
  });
});

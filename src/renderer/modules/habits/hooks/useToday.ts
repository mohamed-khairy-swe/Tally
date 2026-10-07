import { useEffect, useState } from "react";

import { getToday } from "../state/habitCalendar";
import type { HabitDate } from "../types";

export function useToday(): HabitDate {
  const [today, setToday] = useState(getToday);

  useEffect(() => {
    function refreshToday() {
      const next = getToday();
      setToday((current) => (current === next ? current : next));
    }

    const intervalId = window.setInterval(refreshToday, 30_000);
    document.addEventListener("visibilitychange", refreshToday);
    window.addEventListener("focus", refreshToday);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refreshToday);
      window.removeEventListener("focus", refreshToday);
    };
  }, []);

  return today;
}

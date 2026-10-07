import React from "react";
import { Timer, Settings } from "lucide-react";
import "./PomodoroNavigation.css";

export type PomodoroView = "main" | "settings";

interface PomodoroNavigationProps {
  readonly activePage: PomodoroView;
  readonly onPageChange: (page: PomodoroView) => void;
}

function PomodoroNavigation({
  activePage,
  onPageChange,
}: PomodoroNavigationProps) {
  return (
    <nav className="pomodoro-nav" aria-label="Pomodoro navigation">
      <button
        type="button"
        className={`pomodoro-nav__item ${
          activePage === "main" ? "pomodoro-nav__item--active" : ""
        }`}
        onClick={() => onPageChange("main")}
        aria-current={activePage === "main" ? "page" : undefined}
      >
        <Timer size={17} />
        <span>Timer</span>
      </button>

      <button
        type="button"
        className={`pomodoro-nav__item ${
          activePage === "settings" ? "pomodoro-nav__item--active" : ""
        }`}
        onClick={() => onPageChange("settings")}
        aria-current={activePage === "settings" ? "page" : undefined}
      >
        <Settings size={17} />
        <span>Settings</span>
      </button>
    </nav>
  );
}

export default PomodoroNavigation;
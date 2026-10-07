import { useState } from "react";

import Sidebar from "../navigation/Sidebar";
import type { ModuleId } from "../../modules/types";
import PomodoroPage from "../../modules/pomodoro/PomodoroPage";
import HabitsPage from "../../modules/habits/HabitsPage";
import CounterPage from "../../modules/counter/CounterPage";

function AppShell() {
  const [activeModule, setActiveModule] =
    useState<ModuleId>("pomodoro");

  return (
    <div className="app-shell">
      <Sidebar
        activeModule={activeModule}
        onModuleChange={setActiveModule}
      />

      <main className="app-shell__content">
        <div
          className="module-view"
          hidden={activeModule !== "pomodoro"}
        >
          <PomodoroPage />
        </div>

        <div
          className="module-view"
          hidden={activeModule !== "habits"}
        >
          <HabitsPage />
        </div>

        <div
          className="module-view"
          hidden={activeModule !== "counter"}
        >
          <CounterPage />
        </div>
      </main>
    </div>
  );
}

export default AppShell;
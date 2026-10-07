import React from "react";
import { Timer, CheckSquare, Hash, Sun, Moon } from "lucide-react";
import type { ModuleId } from "../../modules/types";
import { useTheme } from "../../theme/themeContext";
import logoSvg from "../../assets/Tally.svg";
import "./Sidebar.css";

interface SidebarProps {
  readonly activeModule: ModuleId;
  readonly onModuleChange: (module: ModuleId) => void;
}

const navigationItems: Array<{
  id: ModuleId;
  label: string;
  icon: React.ReactNode;
}> = [
  {
    id: "pomodoro",
    label: "Pomodoro",
    icon: <Timer size={19} />,
  },
  {
    id: "habits",
    label: "Habits",
    icon: <CheckSquare size={19} />,
  },
  {
    id: "counter",
    label: "Counter",
    icon: <Hash size={19} />,
  },
];

function Sidebar({ activeModule, onModuleChange }: SidebarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="sidebar">
      <div className="sidebar__top">
        <div className="sidebar__brand">
          <img src={logoSvg} alt="Tally" className="sidebar__brand-logo" />
          <span className="sidebar__brand-name">Tally</span>
        </div>

        <nav className="sidebar__navigation" aria-label="Main navigation">
          {navigationItems.map((item) => {
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`sidebar__navigation-item ${
                  isActive ? "sidebar__navigation-item--active" : ""
                }`}
                onClick={() => onModuleChange(item.id)}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="sidebar__icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="sidebar__footer">
        <button
          type="button"
          className="sidebar__theme-toggle"
          onClick={toggleTheme}
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Gruvbox theme`}
          aria-label="Toggle color theme"
        >
          <div className="sidebar__theme-info">
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            <span>Theme</span>
          </div>
          <span className="sidebar__theme-pill">
            {theme === "dark" ? "Dark" : "Light"}
          </span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
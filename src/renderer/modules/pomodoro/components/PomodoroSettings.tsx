import { Plus, Trash2 } from "lucide-react";
import type { PomodoroSettingsProfile } from "../types";
import "./PomodoroSettings.css";

interface PomodoroSettingsProps {
  readonly profiles: PomodoroSettingsProfile[];
  readonly activeProfileId: string;
  readonly onProfileChange: (profileId: string) => void;
  readonly onAddProfile: () => void;
  readonly onUpdateProfile: (
    profileId: string,
    updates: Partial<PomodoroSettingsProfile>,
  ) => void;
  readonly onDeleteProfile?: (profileId: string) => void;
}

function PomodoroSettings({
  profiles,
  activeProfileId,
  onProfileChange,
  onAddProfile,
  onUpdateProfile,
  onDeleteProfile,
}: PomodoroSettingsProps) {
  const activeProfile = profiles.find(
    (profile) => profile.id === activeProfileId,
  );

  if (!activeProfile) {
    return null;
  }

  const updateActiveProfile = (
    updates: Partial<PomodoroSettingsProfile>,
  ) => {
    onUpdateProfile(activeProfile.id, updates);
  };

  return (
    <section className="pomodoro-settings">
      <header className="pomodoro-settings__header">
        <h1>Pomodoro Profiles & Timers</h1>
        <p className="pomodoro-settings__subtitle">
          Configure focus intervals, break lengths, and session cycles.
        </p>
      </header>

      {/* Profiles chip selector */}
      <nav className="pomodoro-settings__profiles-nav" aria-label="Pomodoro settings profiles">
        {profiles.map((profile) => (
          <button
            key={profile.id}
            type="button"
            className={`pomodoro-settings__profile-chip ${
              profile.id === activeProfileId
                ? "pomodoro-settings__profile-chip--active"
                : ""
            }`}
            onClick={() => onProfileChange(profile.id)}
            aria-current={
              profile.id === activeProfileId ? "page" : undefined
            }
          >
            {profile.name}
          </button>
        ))}

        <button
          type="button"
          className="pomodoro-settings__add-profile-btn"
          onClick={onAddProfile}
          aria-label="Add settings profile"
        >
          <Plus size={16} />
          <span>New Profile</span>
        </button>
      </nav>

      {/* Profile Details Card */}
      <div className="pomodoro-settings__card">
        <div className="pomodoro-settings__card-header">
          <h2 className="pomodoro-settings__card-title">{activeProfile.name} Settings</h2>
          {activeProfile.id !== "default" && onDeleteProfile && (
            <button
              type="button"
              className="pomodoro-settings__delete-btn"
              onClick={() => onDeleteProfile(activeProfile.id)}
              aria-label={`Delete ${activeProfile.name} profile`}
            >
              <Trash2 size={15} />
              <span>Delete Profile</span>
            </button>
          )}
        </div>

        <div className="pomodoro-settings__grid">
          <div className="pomodoro-settings__field">
            <label htmlFor="focus-minutes">Focus Duration (minutes)</label>
            <input
              id="focus-minutes"
              type="number"
              min={1}
              step={1}
              value={activeProfile.focusMinutes}
              onChange={(event) => {
                const value = Number(event.target.value);
                if (value >= 1) {
                  updateActiveProfile({ focusMinutes: value });
                }
              }}
            />
          </div>

          <div className="pomodoro-settings__field">
            <label htmlFor="short-break-minutes">Short Break (minutes)</label>
            <input
              id="short-break-minutes"
              type="number"
              min={0}
              step={1}
              value={activeProfile.shortBreakMinutes}
              onChange={(event) => {
                const value = Number(event.target.value);
                if (value >= 0) {
                  updateActiveProfile({ shortBreakMinutes: value });
                }
              }}
            />
          </div>

          <div className="pomodoro-settings__field">
            <label htmlFor="long-break-minutes">Long Break (minutes)</label>
            <input
              id="long-break-minutes"
              type="number"
              min={0}
              step={1}
              value={activeProfile.longBreakMinutes}
              onChange={(event) => {
                const value = Number(event.target.value);
                if (value >= 0) {
                  updateActiveProfile({
                    longBreakMinutes: value,
                    longBreakAfterSession:
                      value === 0
                        ? null
                        : activeProfile.longBreakAfterSession ??
                          activeProfile.sessionLength,
                  });
                }
              }}
            />
          </div>
        </div>

        <div className="pomodoro-settings__field">
          <label htmlFor="session-length">
            Session Length: {activeProfile.sessionLength} cycles
          </label>
          <div className="pomodoro-settings__range-wrap">
            <input
              id="session-length"
              type="range"
              min={1}
              max={10}
              step={1}
              value={activeProfile.sessionLength}
              onChange={(event) => {
                const value = Number(event.target.value);
                const currentLongBreakAfter = activeProfile.longBreakAfterSession;
                updateActiveProfile({
                  sessionLength: value,
                  longBreakAfterSession:
                    currentLongBreakAfter === null
                      ? null
                      : Math.min(currentLongBreakAfter, value),
                });
              }}
            />
            <span className="pomodoro-settings__range-value font-mono">
              {activeProfile.sessionLength}
            </span>
          </div>
        </div>

        {activeProfile.longBreakMinutes > 0 && (
          <div className="pomodoro-settings__field">
            <label htmlFor="long-break-after">Trigger Long Break After Session</label>
            <select
              id="long-break-after"
              value={
                activeProfile.longBreakAfterSession ??
                activeProfile.sessionLength
              }
              onChange={(event) => {
                updateActiveProfile({
                  longBreakAfterSession: Number(event.target.value),
                });
              }}
            >
              {Array.from(
                { length: activeProfile.sessionLength },
                (_, index) => index + 1,
              ).map((session) => (
                <option key={session} value={session}>
                  Session {session}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="pomodoro-settings__checkbox-row">
          <input
            id="auto-start"
            type="checkbox"
            checked={activeProfile.autoStartNextTimer}
            onChange={(event) => {
              updateActiveProfile({
                autoStartNextTimer: event.target.checked,
              });
            }}
          />
          <label htmlFor="auto-start">
            Auto-start next timer when current timer finishes
          </label>
        </div>
      </div>
    </section>
  );
}

export default PomodoroSettings;
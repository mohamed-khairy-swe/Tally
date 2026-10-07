import { useCallback, useState } from "react";

import PomodoroNavigation, {
  type PomodoroView,
} from "./components/PomodoroNavigation";
import PomodoroSettings from "./components/PomodoroSettings";
import PomodoroTimerView from "./components/PomodoroTimerView";
import AddProfileDialog from "./components/AddProfileDialog";
import { usePomodoroTimer } from "./hooks/usePomodoroTimer";
import { DEFAULT_POMODORO_SETTINGS } from "./state/pomodoroSettings";
import {
  loadPomodoroSettingsState,
  savePomodoroSettingsState,
} from "./state/pomodoroStore";
import type { PomodoroSettingsProfile } from "./types";
import { playCompletionSound } from "./audio/completionSound";

function PomodoroPage() {
  const [activePage, setActivePage] = useState<PomodoroView>("main");

  // --- Persistent settings state ---
  // Loaded from electron-store on first render (synchronous because
  // preloadElectronStorage() ran before the tree mounted).
  const [settingsState, setSettingsState] = useState(
    loadPomodoroSettingsState,
  );

  const [isAddProfileDialogOpen, setIsAddProfileDialogOpen] = useState(false);

  const profiles = settingsState.profiles;
  const activeProfileId = settingsState.activeProfileId;

  const activeProfile =
    profiles.find((profile) => profile.id === activeProfileId) ?? profiles[0];

  // Central mutation helper — updates React state AND persists immediately.
  const updateSettingsState = useCallback(
    (updater: (prev: typeof settingsState) => typeof settingsState) => {
      setSettingsState((prev) => {
        const next = updater(prev);
        savePomodoroSettingsState(next);
        return next;
      });
    },
    [],
  );

  // The timer lives here, above the Timer/Settings pages, so it keeps
  // running while Settings is open. And because AppShell keeps this whole
  // page mounted, it also keeps running while another module is visible.
  const { timer, sequence, currentItem, toggle, restart, previous, next } =
    usePomodoroTimer(activeProfile, {
      onTimerFinished: playCompletionSound,
    });

  function handleCreateProfile(name: string) {
    const newProfile: PomodoroSettingsProfile = {
      ...DEFAULT_POMODORO_SETTINGS,
      id: `custom-${crypto.randomUUID()}`,
      name,
    };

    updateSettingsState((prev) => ({
      profiles: [...prev.profiles, newProfile],
      activeProfileId: newProfile.id,
    }));

    setIsAddProfileDialogOpen(false);
  }

  function handleUpdateProfile(
    profileId: string,
    updates: Partial<PomodoroSettingsProfile>,
  ) {
    updateSettingsState((prev) => ({
      ...prev,
      profiles: prev.profiles.map((profile) =>
        profile.id === profileId ? { ...profile, ...updates } : profile,
      ),
    }));
  }

  function handleProfileChange(profileId: string) {
    updateSettingsState((prev) => ({ ...prev, activeProfileId: profileId }));
  }

  function handleDeleteProfile(profileId: string) {
    if (profileId === "default") {
      return;
    }
    updateSettingsState((prev) => {
      const nextProfiles = prev.profiles.filter((p) => p.id !== profileId);
      if (nextProfiles.length === 0) {
        return prev;
      }
      const nextActiveId =
        prev.activeProfileId === profileId
          ? nextProfiles[0].id
          : prev.activeProfileId;
      return {
        profiles: nextProfiles,
        activeProfileId: nextActiveId,
      };
    });
  }

  return (
    <div>
      <PomodoroNavigation
        activePage={activePage}
        onPageChange={setActivePage}
      />

      {activePage === "main" && (
        <PomodoroTimerView
          timer={timer}
          currentItem={currentItem}
          sequence={sequence}
          activeProfile={activeProfile}
          profileName={activeProfile.name}
          sessionLength={activeProfile.sessionLength}
          sequenceLength={sequence.length}
          onToggle={toggle}
          onRestart={restart}
          onPrevious={previous}
          onNext={next}
        />
      )}

      {activePage === "settings" && (
        <PomodoroSettings
          profiles={profiles}
          activeProfileId={activeProfileId}
          onProfileChange={handleProfileChange}
          onAddProfile={() => setIsAddProfileDialogOpen(true)}
          onUpdateProfile={handleUpdateProfile}
          onDeleteProfile={handleDeleteProfile}
        />
      )}

      {isAddProfileDialogOpen && (
        <AddProfileDialog
          onCreate={handleCreateProfile}
          onCancel={() => setIsAddProfileDialogOpen(false)}
        />
      )}
    </div>
  );
}

export default PomodoroPage;
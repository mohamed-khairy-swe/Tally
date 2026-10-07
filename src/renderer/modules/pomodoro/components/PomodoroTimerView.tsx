import React from "react";
import { Play, Pause, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import { formatRemainingTime } from "../state/pomodoroTimer";
import type {
  PomodoroSequenceItem,
  PomodoroSettingsProfile,
  PomodoroTimerState,
  PomodoroTimerType,
} from "../types";
import "./PomodoroTimerView.css";

const TIMER_TYPE_LABELS: Record<PomodoroTimerType, string> = {
  focus: "Focus",
  shortBreak: "Short Break",
  longBreak: "Long Break",
};

interface PomodoroTimerViewProps {
  readonly timer: PomodoroTimerState;
  readonly currentItem: PomodoroSequenceItem;
  readonly sequence?: readonly PomodoroSequenceItem[];
  readonly activeProfile?: PomodoroSettingsProfile;
  readonly profileName: string;
  readonly sessionLength: number;
  readonly sequenceLength: number;
  readonly onToggle: () => void;
  readonly onRestart: () => void;
  readonly onPrevious: () => void;
  readonly onNext: () => void;
}

export function PomodoroTimerView({
  timer,
  currentItem,
  sequence = [],
  activeProfile,
  profileName,
  sessionLength,
  sequenceLength,
  onToggle,
  onRestart,
  onPrevious,
  onNext,
}: PomodoroTimerViewProps) {
  const isRunning = timer.status === "running";
  const isPaused = timer.status === "paused";
  const isFinished = timer.status === "finished";

  // Calculate progress for circular ring
  const duration = Math.max(1, timer.durationSeconds);
  const remaining = Math.max(0, timer.remainingSeconds);
  // fraction remaining from 1.0 (start) to 0.0 (end)
  const remainingFraction = remaining / duration;

  // SVG circular ring metrics
  const size = 250;
  const strokeWidth = 8;
  const center = size / 2;
  const radius = center - strokeWidth * 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - remainingFraction);

  // Timer type CSS modifier class
  const typeModifier =
    timer.currentTimerType === "focus"
      ? "timer-view--focus"
      : timer.currentTimerType === "shortBreak"
        ? "timer-view--short-break"
        : "timer-view--long-break";

  // Settings summary string
  const settingsSummary = activeProfile
    ? `${profileName} · ${activeProfile.focusMinutes}m Focus / ${activeProfile.shortBreakMinutes}m Break · Session ${currentItem.sessionNumber} of ${sessionLength}${
        activeProfile.autoStartNextTimer ? " · Auto-start" : ""
      }`
    : `${profileName} · Session ${currentItem.sessionNumber} of ${sessionLength}`;

  return (
    <div className={`timer-view ${typeModifier}`}>
      {/* Top Header: Timer Type & Profile Settings */}
      <div className="timer-view__header">
        <h1 className="timer-view__type-title">
          {TIMER_TYPE_LABELS[timer.currentTimerType]}
        </h1>
        <p className="timer-view__settings-subtitle">{settingsSummary}</p>
      </div>

      {/* Center: Circular Progress Ring with Timer Countdown */}
      <div className="timer-view__ring-container">
        <svg
          className="timer-view__svg"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Background Track Circle */}
          <circle
            className="timer-view__track"
            cx={center}
            cy={center}
            r={radius}
            strokeWidth={strokeWidth}
          />
          {/* Active Animated Progress Circle */}
          <circle
            className="timer-view__progress"
            cx={center}
            cy={center}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>

        {/* Content Centered inside the Ring */}
        <div className="timer-view__center-content">
          <div className="timer-view__readout font-mono">
            {formatRemainingTime(timer.remainingSeconds)}
          </div>
          <div className="timer-view__status-badge">
            {isRunning
              ? timer.currentTimerType === "focus"
                ? "FOCUSING"
                : "ON BREAK"
              : isPaused
                ? "PAUSED"
                : isFinished
                  ? "COMPLETED"
                  : "READY"}
          </div>
        </div>
      </div>

      {/* Controls Container directly under the Ring */}
      <div className="timer-view__controls" aria-label="Timer controls">
        {/* Play/Pause Button - centered directly under the ring */}
        <div className="timer-view__controls-primary">
          <button
            type="button"
            className="timer-view__control-btn timer-view__control-btn--primary"
            onClick={onToggle}
            disabled={isFinished}
            title={isRunning ? "Pause Timer" : "Start Timer"}
            aria-label={isRunning ? "Pause" : "Start"}
          >
            {isRunning ? (
              <Pause size={26} />
            ) : (
              <Play size={26} className="play-icon-offset" />
            )}
          </button>
        </div>

        {/* Secondary controls centered beneath the Play button */}
        <div className="timer-view__controls-secondary">
          <button
            type="button"
            className="timer-view__control-btn timer-view__control-btn--secondary"
            onClick={onPrevious}
            title="Previous Session"
            aria-label="Previous session"
          >
            <SkipBack size={18} />
          </button>

          <button
            type="button"
            className="timer-view__control-btn timer-view__control-btn--secondary"
            onClick={onRestart}
            title="Restart Timer"
            aria-label="Restart current timer"
          >
            <RotateCcw size={18} />
          </button>

          <button
            type="button"
            className="timer-view__control-btn timer-view__control-btn--secondary"
            onClick={onNext}
            title="Next Session"
            aria-label="Next session"
          >
            <SkipForward size={18} />
          </button>
        </div>
      </div>

      {/* Dynamic Session Timeline under Controllers */}
      {sequence.length > 0 && (
        <div
          className="timer-view__timeline-wrapper"
          aria-label="Session timeline"
        >
          <div className="timer-view__timeline">
            {sequence.map((item, index) => {
              const isPast = index < timer.currentSequenceIndex;
              const isCurrent = index === timer.currentSequenceIndex;
              const stepTypeClass =
                item.type === "focus"
                  ? "timer-view__timeline-step--focus"
                  : item.type === "shortBreak"
                    ? "timer-view__timeline-step--short-break"
                    : "timer-view__timeline-step--long-break";

              const stateClass = isCurrent
                ? "timer-view__timeline-step--current"
                : isPast
                  ? "timer-view__timeline-step--past"
                  : "timer-view__timeline-step--future";

              const label =
                item.type === "focus"
                  ? `Focus ${item.sessionNumber}`
                  : item.type === "shortBreak"
                    ? `Break`
                    : `Long Break`;

              return (
                <div
                  key={`${item.index}-${item.type}-${item.sessionNumber}`}
                  className={`timer-view__timeline-step ${stepTypeClass} ${stateClass}`}
                  title={`${label} (Step ${index + 1} of ${sequence.length})`}
                >
                  <div className="timer-view__timeline-node">
                    {isPast ? "✓" : item.sessionNumber}
                  </div>
                  <span className="timer-view__timeline-label">{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default PomodoroTimerView;
export type HabitTrackingType =
  | "binary"
  | "progressive";

export type HabitScheduleType =
  | "daily"
  | "weekly"
  | "monthly";

export type HabitDate = string;

export interface HabitSchedule {
  readonly type: HabitScheduleType;

  /**
   * Used when type === "weekly".
   *
   * Values use JavaScript's conventional weekday numbering:
   * 0 = Sunday
   * 1 = Monday
   * ...
   * 6 = Saturday
   */
  readonly weekdays: readonly number[];

  /**
   * Used when type === "monthly".
   *
   * Values are 1 through 31.
   */
  readonly monthDays: readonly number[];
}

export interface HabitConfiguration {
  readonly id: string;

  /**
   * The date from which this configuration applies.
   */
  readonly effectiveFrom: HabitDate;

  readonly trackingType: HabitTrackingType;

  readonly schedule: HabitSchedule;

  /**
   * Only used by progressive habits.
   */
  readonly target: number | null;
  readonly increment: number | null;
  readonly unit: string | null;
}

export interface Habit {
  readonly id: string;

  name: string;

  categoryId: string | null;

  startDate: HabitDate;

  archived: boolean;

  completedColor: string;
  partialColor: string;

  /**
   * Configuration history.
   *
   * The configuration whose effectiveFrom is the latest
   * date <= an occurrence date is the configuration that
   * applies to that occurrence.
   */
  configurations: readonly HabitConfiguration[];
}

export interface HabitOccurrence {
  readonly habitId: string;

  /**
   * Date-only identity.
   *
   * Example: "2026-10-07"
   */
  readonly date: HabitDate;

  /**
   * The configuration that was active for this occurrence.
   */
  readonly configurationId: string;

  /**
   * Binary:
   *   0 = incomplete
   *   1 = completed
   *
   * Progressive:
   *   0..target
   */
  progress: number;
}

export interface HabitCategory {
  readonly id: string;

  name: string;
}

export interface HabitSettings {
  firstDayOfWeek: number;

  defaultCompletedColor: string;
  defaultPartialColor: string;
}
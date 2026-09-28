import type { SupportedLanguage } from '../i18n/Language';
import type { CellState } from '../puzzle/types';

export interface SerializedPuzzleState {
  readonly mode: 'campaign' | 'daily' | 'tutorial' | 'endless';
  readonly puzzleId: string;
  readonly cells: readonly (readonly CellState[])[];
  readonly activePlayMs: number;
  readonly hintsUsed: number;
  readonly startedAtMs: number;
}

export interface CampaignLevelResult {
  readonly bestTimeMs: number;
  readonly minHintsUsed: number;
  readonly solveCount: number;
  readonly solvedWithoutHints: boolean;
}

export interface DailyResultSummary {
  readonly bestTimeMs: number;
  readonly minHintsUsed: number;
  readonly solvedWithoutHints: boolean;
}

export interface DailyProfileState {
  readonly drafts: Readonly<Record<string, SerializedPuzzleState>>;
  readonly currentStreak: number;
  readonly bestStreak: number;
  readonly lastSolvedDate: string | null;
  readonly totalSolved: number;
  readonly solvedDates: readonly string[];
  readonly results: Readonly<Record<string, DailyResultSummary>>;
}

export interface TutorialProfileState {
  readonly completedLevelIds: readonly string[];
  readonly completed: boolean;
  readonly activePuzzle: SerializedPuzzleState | null;
}

export type EndlessActiveKind = 'fresh' | 'retry' | 'freeplay';

export interface EndlessProfileState {
  /** Next catalog index that has never been served in ranked Endless. */
  readonly nextFreshIndex: number;
  /** Unique ranked catalog entries actually solved. */
  readonly completed: number;
  /** Ordered unique catalog indices skipped and still awaiting a ranked solve. */
  readonly skipped: readonly number[];
  /** Fresh ranked solves since the last skipped-puzzle retry was resolved or re-skipped. */
  readonly freshSolvesSinceRetry: number;
  /** Persisted current catalog selection so reload resumes the exact same puzzle. */
  readonly activeCatalogIndex: number | null;
  readonly activeKind: EndlessActiveKind | null;
  readonly activePuzzle: SerializedPuzzleState | null;
  /** Consecutive ranked Endless solves completed without any hints. */
  readonly currentStreak: number;
  /** Highest ranked clean Endless streak ever achieved. */
  readonly bestStreak: number;
  /** Number of Free Play advances after every ranked catalog entry has been solved. */
  readonly freePlayOrdinal: number;
}

export interface MasteryProfileState {
  /** Lifetime Master Rating. Accumulates before MASTER but stays hidden until MASTER. */
  readonly rating: number;
}

export interface PlayerSettings {
  readonly musicEnabled: boolean;
  readonly soundEnabled: boolean;
  readonly language: SupportedLanguage;
}

/**
 * The only supported player-profile schema before the first public release.
 * Historical development saves are intentionally not migrated.
 */
export interface PlayerProfile {
  readonly schemaVersion: 1;
  readonly tutorial: TutorialProfileState;
  readonly campaign: {
    readonly completedLevelIds: readonly string[];
    readonly lastPlayedLevelId: string | null;
    readonly levelResults: Readonly<Record<string, CampaignLevelResult>>;
    readonly drafts: Readonly<Record<string, SerializedPuzzleState>>;
  };
  readonly daily: DailyProfileState;
  readonly endless: EndlessProfileState;
  readonly mastery: MasteryProfileState;
  readonly settings: PlayerSettings;
  readonly hints: {
    readonly freeRemaining: number;
    readonly totalUsed: number;
    readonly rechargeAnchorMs?: number | null;
  };
  readonly totals: {
    readonly activePlayMs: number;
  };
}

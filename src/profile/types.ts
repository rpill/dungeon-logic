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

export interface EndlessProfileState {
  /** Zero-based logical Endless puzzle number. The finite verified catalog is an internal pool. */
  readonly ordinal: number;
  /** Total Endless puzzles solved. This count is intentionally unbounded. */
  readonly completed: number;
  readonly activePuzzle: SerializedPuzzleState | null;
  /** Consecutive Endless solves completed without any hints. */
  readonly currentCleanStreak: number;
  /** Highest clean Endless streak ever achieved. */
  readonly bestCleanStreak: number;
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
  readonly settings: PlayerSettings;
  readonly hints: {
    readonly freeRemaining: number;
    readonly totalUsed: number;
    readonly rechargeAnchorMs?: number | null;
  };
  readonly ads: {
    readonly campaignCompletionsSinceOpportunity: number;
    readonly lastInterstitialAtMs: number | null;
  };
  readonly totals: {
    readonly activePlayMs: number;
  };
}

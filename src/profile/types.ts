import type { SupportedLanguage } from '../i18n/Language';
import type { CellState } from '../puzzle/types';

export interface SerializedPuzzleState {
  readonly mode: 'campaign' | 'daily' | 'tutorial';
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
  readonly activePuzzle: SerializedPuzzleState | null;
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

export interface PlayerSettings {
  readonly musicEnabled: boolean;
  readonly soundEnabled: boolean;
  readonly vibrationEnabled: boolean;
  readonly language: SupportedLanguage;
}

/** Persisted unified profile before the dedicated Tutorial chapter existed. */
export interface PlayerProfileV1 {
  readonly schemaVersion: 1;
  readonly campaign: {
    readonly completedLevelIds: readonly string[];
    readonly lastPlayedLevelId: string | null;
    readonly levelResults: Readonly<Record<string, CampaignLevelResult>>;
    readonly activePuzzle: SerializedPuzzleState | null;
  };
  readonly daily: DailyProfileState;
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

export interface PlayerProfileV2 {
  readonly schemaVersion: 2;
  readonly tutorial: TutorialProfileState;
  readonly campaign: {
    readonly completedLevelIds: readonly string[];
    readonly lastPlayedLevelId: string | null;
    readonly levelResults: Readonly<Record<string, CampaignLevelResult>>;
    readonly activePuzzle: SerializedPuzzleState | null;
  };
  readonly daily: DailyProfileState;
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

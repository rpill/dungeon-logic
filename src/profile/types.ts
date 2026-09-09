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

/** Daily persistence used through profile schema v3: one ranked active puzzle. */
export interface DailyProfileStateV3 {
  readonly activePuzzle: SerializedPuzzleState | null;
  readonly currentStreak: number;
  readonly bestStreak: number;
  readonly lastSolvedDate: string | null;
  readonly totalSolved: number;
  readonly solvedDates: readonly string[];
  readonly results: Readonly<Record<string, DailyResultSummary>>;
}

/** Current Daily persistence: every started unsolved date owns its own draft. */
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
  readonly daily: DailyProfileStateV3;
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

/** Persisted unified profile used by Tutorial v2 before per-level Campaign drafts. */
export interface PlayerProfileV2 {
  readonly schemaVersion: 2;
  readonly tutorial: TutorialProfileState;
  readonly campaign: {
    readonly completedLevelIds: readonly string[];
    readonly lastPlayedLevelId: string | null;
    readonly levelResults: Readonly<Record<string, CampaignLevelResult>>;
    readonly activePuzzle: SerializedPuzzleState | null;
  };
  readonly daily: DailyProfileStateV3;
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

/** Persisted unified profile used before per-date Daily drafts. */
export interface PlayerProfileV3 {
  readonly schemaVersion: 3;
  readonly tutorial: TutorialProfileState;
  readonly campaign: {
    readonly completedLevelIds: readonly string[];
    readonly lastPlayedLevelId: string | null;
    readonly levelResults: Readonly<Record<string, CampaignLevelResult>>;
    readonly drafts: Readonly<Record<string, SerializedPuzzleState>>;
  };
  readonly daily: DailyProfileStateV3;
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

/** Current profile schema: Campaign and Daily both keep independent persistent drafts. */
export interface PlayerProfileV4 {
  readonly schemaVersion: 4;
  readonly tutorial: TutorialProfileState;
  readonly campaign: {
    readonly completedLevelIds: readonly string[];
    readonly lastPlayedLevelId: string | null;
    readonly levelResults: Readonly<Record<string, CampaignLevelResult>>;
    readonly drafts: Readonly<Record<string, SerializedPuzzleState>>;
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

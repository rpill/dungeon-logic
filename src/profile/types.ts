import type { CellState } from '../puzzle/types';

export interface SerializedPuzzleState {
  readonly mode: 'campaign' | 'daily';
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
  readonly currentStreak: number;
  readonly bestStreak: number;
  readonly lastSolvedDate: string | null;
  readonly totalSolved: number;
  readonly solvedDates: readonly string[];
  readonly results: Readonly<Record<string, DailyResultSummary>>;
}

export interface PlayerSettings {
  readonly musicEnabled: boolean;
  readonly soundEnabled: boolean;
  readonly vibrationEnabled: boolean;
  readonly language: string;
}

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
  };
  readonly ads: {
    readonly campaignCompletionsSinceOpportunity: number;
    readonly lastInterstitialAtMs: number | null;
  };
  readonly totals: {
    readonly activePlayMs: number;
  };
}

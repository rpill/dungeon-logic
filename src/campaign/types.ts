import type {
  CampaignLevelEntry,
  CampaignOnboardingId,
  ManuscriptDefinition,
} from '../content/campaign/types';
import type { CampaignLevelResult } from '../profile/types';
import type { LevelDefinition } from '../puzzle/types';

/** Legacy v1 save shape. Kept only so PlayerProfile migration can recognize it. */
export interface CampaignProgressV1 {
  readonly schemaVersion: 1;
  readonly highestUnlockedSlot: number;
  readonly completedLevelIds: readonly string[];
  readonly lastPlayedLevelId: string | null;
}

/** Derived campaign state used by runtime. No unlock counter is persisted. */
export interface CampaignProgressSnapshot {
  readonly completedLevelIds: readonly string[];
  readonly lastPlayedLevelId: string | null;
}

export type CampaignLevelState = 'completed' | 'current' | 'unlocked' | 'locked';

export interface CampaignCompletionResult {
  readonly progress: CampaignProgressSnapshot;
  readonly recommendedNextLevel: CampaignLevelEntry | null;
  readonly unlockedManuscript: ManuscriptDefinition | null;
  readonly persisted: boolean;
}

export type CampaignCompletionMetadata = CampaignLevelResult;

export type GameLaunchContext =
  | { readonly mode: 'campaign'; readonly campaignLevelId: string }
  | { readonly mode: 'dev' };

export interface GameSceneData {
  readonly level: LevelDefinition;
  readonly context: GameLaunchContext;
  /** Legacy onboarding ids remain for campaign-content compatibility. */
  readonly onboarding: readonly CampaignOnboardingId[];
  readonly contextualOnboarding: boolean;
}

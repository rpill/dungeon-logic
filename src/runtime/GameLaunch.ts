import { getCampaignLevelState, shouldShowCampaignOnboarding } from '../campaign/CampaignProgress';
import type {
  CampaignCompletionMetadata,
  CampaignCompletionResult,
  CampaignProgressSnapshot,
  GameSceneData,
} from '../campaign/types';
import type {
  CampaignLevelEntry,
  CampaignOnboardingId,
} from '../content/campaign/types';
import type { DailyEntry } from '../content/daily/types';
import type { DailyCompletionResult } from '../daily/DailyService';
import type { LevelDefinition } from '../puzzle/types';
import type { DailyResultSummary } from '../profile/types';
import { shouldShowContextualOnboarding } from '../onboarding/OnboardingFlow';

export const ONBOARDING_COPY: Readonly<Record<CampaignOnboardingId, string>> = {
  'row-column-clues': 'Numbers show how many wall cells belong in each row and column.',
  'monster-dead-end': 'Every Monster must sit at a corridor dead end: exactly one adjacent open floor cell.',
  'treasure-room-rule': 'A Chest belongs inside a 3×3 Treasure Room with exactly one entrance.',
};

export interface LevelSelectItem {
  readonly entry: CampaignLevelEntry;
  readonly state: 'completed' | 'current' | 'unlocked' | 'locked';
  readonly playable: boolean;
}

export interface CampaignCompletionPort {
  completeLevel(
    id: string,
    resultMetadata?: CampaignCompletionMetadata,
  ): Promise<CampaignCompletionResult>;
}

export interface CampaignStartPort {
  startLevel(id: string): Promise<CampaignLevelEntry>;
  getProgress(): CampaignProgressSnapshot;
}

export interface DailyCompletionPort {
  completeDaily(
    dateKey: string,
    dailyId: string,
    result: DailyResultSummary,
  ): Promise<DailyCompletionResult | null>;
}

export function createDevGameSceneData(level: LevelDefinition): GameSceneData {
  return {
    level,
    context: {
      mode: 'dev',
    },
    onboarding: [],
    contextualOnboarding: false,
  };
}

export function createDailyGameSceneData(entry: DailyEntry): GameSceneData {
  return {
    level: entry.level,
    context: {
      mode: 'daily',
      dailyId: entry.id,
      dateKey: entry.dateKey,
    },
    onboarding: [],
    contextualOnboarding: false,
  };
}

export async function completeDailyGameLaunch(
  data: GameSceneData,
  daily: DailyCompletionPort,
  result: DailyResultSummary,
): Promise<DailyCompletionResult | null> {
  if (data.context.mode !== 'daily') return null;
  return daily.completeDaily(data.context.dateKey, data.context.dailyId, result);
}

export function createCampaignGameSceneData(
  entry: CampaignLevelEntry,
  progress: CampaignProgressSnapshot,
): GameSceneData {
  return {
    level: entry.level,
    context: {
      mode: 'campaign',
      campaignLevelId: entry.id,
    },
    onboarding: shouldShowCampaignOnboarding(entry, progress)
      ? entry.onboarding
      : [],
    contextualOnboarding: shouldShowContextualOnboarding(
      entry.id,
      progress.completedLevelIds,
    ),
  };
}

export function createLevelSelectItems(
  entries: readonly CampaignLevelEntry[],
  progress: CampaignProgressSnapshot,
): readonly LevelSelectItem[] {
  return entries.map((entry) => {
    const state = getCampaignLevelState(entry, progress, entries);
    return {
      entry,
      state,
      playable: state !== 'locked',
    };
  });
}

export function createRestartGameSceneData(data: GameSceneData): GameSceneData {
  return data;
}

export function createOnboardingMessages(data: GameSceneData): readonly string[] {
  return data.onboarding.map((id) => ONBOARDING_COPY[id]);
}

export async function completeGameLaunch(
  data: GameSceneData,
  campaign: CampaignCompletionPort,
  resultMetadata?: CampaignCompletionMetadata,
): Promise<CampaignCompletionResult | null> {
  if (data.context.mode !== 'campaign') return null;
  return campaign.completeLevel(data.context.campaignLevelId, resultMetadata);
}

export function getCampaignCompletionActions(
  result: CampaignCompletionResult,
): readonly ('next' | 'archive')[] {
  return result.recommendedNextLevel === null
    ? ['archive']
    : ['next', 'archive'];
}

export async function createNextCampaignGameSceneData(
  nextLevel: CampaignLevelEntry,
  campaign: CampaignStartPort,
): Promise<GameSceneData> {
  const started = await campaign.startLevel(nextLevel.id);
  return createCampaignGameSceneData(started, campaign.getProgress());
}

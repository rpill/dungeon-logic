import { getCampaignLevelState } from '../campaign/CampaignProgress';
import type { SupportedLanguage } from '../i18n/Language';
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
import type { TutorialLevelEntry } from '../content/tutorial/types';
import type { DailyAttemptLaunch, DailyCompletionResult } from '../daily/DailyService';
import type { LevelDefinition } from '../puzzle/types';

export const ONBOARDING_COPY: Readonly<Record<CampaignOnboardingId, string>> = {
  'row-column-clues': 'Numbers show how many wall cells belong in each row and column.',
  'monster-dead-end': 'Every Monster must sit at a corridor dead end: exactly one adjacent open floor cell.',
  'treasure-room-rule': 'A Chest belongs inside a 3×3 Treasure Room with exactly one entrance.',
};

const RU_ONBOARDING_COPY: Readonly<Record<CampaignOnboardingId, string>> = {
  'row-column-clues': 'Числа показывают, сколько клеток-стен должно быть в каждой строке и каждом столбце.',
  'monster-dead-end': 'Каждый монстр должен находиться в тупике коридора: рядом ровно одна открытая клетка пола.',
  'treasure-room-rule': 'Каждый сундук находится внутри комнаты 3×3 с ровно одним входом.',
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
    elapsedMs?: number,
    hintsUsed?: number,
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


export function createTutorialGameSceneData(entry: TutorialLevelEntry): GameSceneData {
  return {
    level: entry.level,
    context: {
      mode: 'tutorial',
      tutorialLevelId: entry.id,
    },
    onboarding: [],
    contextualOnboarding: true,
  };
}

export function createDailyGameSceneData(
  entry: DailyEntry,
  attempt?: Pick<DailyAttemptLaunch, 'ranked' | 'archive' | 'elapsedMsAtLaunch'>,
): GameSceneData {
  return {
    level: entry.level,
    context: {
      mode: 'daily',
      dailyId: entry.id,
      dateKey: entry.dateKey,
      ranked: attempt?.ranked ?? true,
      archive: attempt?.archive ?? false,
      elapsedMsAtLaunch: attempt?.elapsedMsAtLaunch ?? 0,
    },
    onboarding: [],
    contextualOnboarding: false,
  };
}

export async function completeDailyGameLaunch(
  data: GameSceneData,
  daily: DailyCompletionPort,
  elapsedMs?: number,
  hintsUsed?: number,
): Promise<DailyCompletionResult | null> {
  if (data.context.mode !== 'daily') return null;
  return daily.completeDaily(data.context.dateKey, data.context.dailyId, elapsedMs, hintsUsed);
}

export function createCampaignGameSceneData(
  entry: CampaignLevelEntry,
  _progress: CampaignProgressSnapshot,
): GameSceneData {
  return {
    level: entry.level,
    context: {
      mode: 'campaign',
      campaignLevelId: entry.id,
    },
    onboarding: [],
    contextualOnboarding: false,
  };
}

export function createLevelSelectItems(
  entries: readonly CampaignLevelEntry[],
  progress: CampaignProgressSnapshot,
  campaignUnlocked = true,
): readonly LevelSelectItem[] {
  return entries.map((entry) => {
    const state = campaignUnlocked
      ? getCampaignLevelState(entry, progress, entries)
      : 'locked';
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

export function createOnboardingMessages(
  data: GameSceneData,
  language: SupportedLanguage = 'en',
): readonly string[] {
  const copy = language === 'ru' ? RU_ONBOARDING_COPY : ONBOARDING_COPY;
  return data.onboarding.map((id) => copy[id]);
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
): readonly ('next' | 'levels')[] {
  return result.recommendedNextLevel === null
    ? ['levels']
    : ['next', 'levels'];
}

export async function createNextCampaignGameSceneData(
  nextLevel: CampaignLevelEntry,
  campaign: CampaignStartPort,
): Promise<GameSceneData> {
  const started = await campaign.startLevel(nextLevel.id);
  return createCampaignGameSceneData(started, campaign.getProgress());
}

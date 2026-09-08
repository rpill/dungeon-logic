import {
  CAMPAIGN_MANUSCRIPTS,
} from '../content/campaign/manuscripts';
import type {
  CampaignLevelEntry,
  ManuscriptDefinition,
  ManuscriptId,
} from '../content/campaign/types';
import type { PlayerProfileV1 } from '../profile/types';
import { isManuscriptUnlocked } from '../campaign/CampaignUnlocks';
import type { DailyEntry } from '../content/daily/types';
import type { DailyTodaySnapshot } from '../daily/DailyService';
import type { DailyResultSummary } from '../profile/types';

export const HOME_SCENE_KEY = 'HomeScene';
export const ARCHIVE_SCENE_KEY = 'ArchiveScene';

export interface MetaCampaignPort {
  getLevels(): readonly CampaignLevelEntry[];
  getContinueLevel(): CampaignLevelEntry | null;
}

export type HomeCampaignAction =
  | { readonly kind: 'start'; readonly levelId: string }
  | { readonly kind: 'continue'; readonly levelId: string }
  | { readonly kind: 'choose-level' };

export type HomeDailyAction =
  | { readonly kind: 'hidden' }
  | { readonly kind: 'unavailable' }
  | {
      readonly kind: 'new';
      readonly entry: DailyEntry;
      readonly dateKey: string;
      readonly currentStreak: number;
    }
  | {
      readonly kind: 'solved';
      readonly entry: DailyEntry;
      readonly dateKey: string;
      readonly currentStreak: number;
      readonly result: DailyResultSummary;
    };

export interface ManuscriptProgressView {
  readonly solved: number;
  readonly total: number;
}

export interface RealManuscriptViewModel {
  readonly kind: 'real';
  readonly id: ManuscriptId;
  readonly roman: ManuscriptDefinition['roman'];
  readonly title: ManuscriptDefinition['title'];
  readonly unlocked: boolean;
  readonly interactive: true;
  readonly state: 'locked' | 'active' | 'passed' | 'complete';
  readonly progress: ManuscriptProgressView;
  readonly requirementText: string | null;
  readonly requiredForNext: number | null;
  readonly promotedLevelIds: readonly string[];
}

export interface SealedManuscriptViewModel {
  readonly kind: 'sealed';
  readonly id: 'sealed-v' | 'sealed-vi';
  readonly roman: 'V' | 'VI';
  readonly title: 'Запечатанная рукопись';
  readonly interactive: false;
  readonly progress: null;
  readonly requirementText: null;
  readonly promotedLevelIds: readonly [];
}

export type ManuscriptViewModel =
  | RealManuscriptViewModel
  | SealedManuscriptViewModel;

export function getHomeCampaignAction(
  campaign: MetaCampaignPort,
  profile: PlayerProfileV1,
): HomeCampaignAction {
  const levels = campaign.getLevels();
  if (levels.length === 0) return { kind: 'choose-level' };

  const completed = new Set(profile.campaign.completedLevelIds);
  if (levels.every((entry) => completed.has(entry.id))) {
    return { kind: 'choose-level' };
  }

  const continueLevel = campaign.getContinueLevel();
  if (continueLevel === null) return { kind: 'choose-level' };

  if (completed.size === 0 && profile.campaign.lastPlayedLevelId === null) {
    return { kind: 'start', levelId: continueLevel.id };
  }

  return { kind: 'continue', levelId: continueLevel.id };
}

export function shouldShowDailyEntry(profile: PlayerProfileV1): boolean {
  return profile.campaign.completedLevelIds.includes('campaign-005');
}

export function getHomeDailyAction(
  profile: PlayerProfileV1,
  today: DailyTodaySnapshot | null,
): HomeDailyAction {
  if (!shouldShowDailyEntry(profile)) return { kind: 'hidden' };
  if (today === null || today.entry === null) return { kind: 'unavailable' };

  if (today.solved && today.result !== null) {
    return {
      kind: 'solved',
      entry: today.entry,
      dateKey: today.dateKey,
      currentStreak: today.currentStreak,
      result: today.result,
    };
  }

  return {
    kind: 'new',
    entry: today.entry,
    dateKey: today.dateKey,
    currentStreak: today.currentStreak,
  };
}

function promotedEntriesForManuscript(
  manifest: readonly CampaignLevelEntry[],
  manuscript: ManuscriptDefinition,
): readonly CampaignLevelEntry[] {
  const slots = new Set(manuscript.slots);
  return manifest
    .filter((entry) => slots.has(entry.slot))
    .slice()
    .sort((left, right) => left.slot - right.slot);
}

function requirementForLockedManuscript(
  manuscriptIndex: number,
): string | null {
  if (manuscriptIndex <= 0) return null;
  const manuscript = CAMPAIGN_MANUSCRIPTS[manuscriptIndex];
  const previous = CAMPAIGN_MANUSCRIPTS[manuscriptIndex - 1];
  return `Завершите ${manuscript.requiredPreviousSolved} задач рукописи ${previous.roman}`;
}

export function getManuscriptViewModels(
  manifest: readonly CampaignLevelEntry[],
  profile: PlayerProfileV1,
): readonly ManuscriptViewModel[] {
  const completed = new Set(profile.campaign.completedLevelIds);

  const real = CAMPAIGN_MANUSCRIPTS.map((manuscript, index): RealManuscriptViewModel => {
    const promoted = promotedEntriesForManuscript(manifest, manuscript);
    const solved = promoted.filter((entry) => completed.has(entry.id)).length;
    const unlocked = isManuscriptUnlocked(
      manuscript.id,
      profile.campaign.completedLevelIds,
      manifest,
    );
    const next = CAMPAIGN_MANUSCRIPTS[index + 1];
    const requiredForNext = next?.requiredPreviousSolved ?? null;
    const complete = solved === manuscript.slots.length;
    const passed = requiredForNext !== null && solved >= requiredForNext;

    return {
      kind: 'real',
      id: manuscript.id,
      roman: manuscript.roman,
      title: manuscript.title,
      unlocked,
      interactive: true,
      state: !unlocked
        ? 'locked'
        : complete
          ? 'complete'
          : passed
            ? 'passed'
            : 'active',
      progress: {
        solved,
        total: manuscript.slots.length,
      },
      requirementText: unlocked ? null : requirementForLockedManuscript(index),
      requiredForNext,
      promotedLevelIds: promoted.map((entry) => entry.id),
    };
  });

  const sealed: readonly SealedManuscriptViewModel[] = [
    {
      kind: 'sealed',
      id: 'sealed-v',
      roman: 'V',
      title: 'Запечатанная рукопись',
      interactive: false,
      progress: null,
      requirementText: null,
      promotedLevelIds: [],
    },
    {
      kind: 'sealed',
      id: 'sealed-vi',
      roman: 'VI',
      title: 'Запечатанная рукопись',
      interactive: false,
      progress: null,
      requirementText: null,
      promotedLevelIds: [],
    },
  ];

  return [...real, ...sealed];
}

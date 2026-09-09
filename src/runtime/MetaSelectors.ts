import {
  CAMPAIGN_MANUSCRIPTS,
} from '../content/campaign/manuscripts';
import type {
  CampaignLevelEntry,
  ManuscriptDefinition,
  ManuscriptId,
} from '../content/campaign/types';
import { getUiCopy } from '../i18n/UiCopy';
import type { SupportedLanguage } from '../i18n/Language';
import type { PlayerProfileV2 } from '../profile/types';
import { isManuscriptUnlocked } from '../campaign/CampaignUnlocks';
import type { DailyEntry } from '../content/daily/types';
import type { DailyTodaySnapshot } from '../daily/DailyService';
import type { DailyResultSummary } from '../profile/types';

export const HOME_SCENE_KEY = 'HomeScene';
export const ARCHIVE_SCENE_KEY = 'ArchiveScene';
export const STATS_SCENE_KEY = 'StatsScene';
export const SETTINGS_SCENE_KEY = 'SettingsScene';

export interface MetaCampaignPort {
  getLevels(): readonly CampaignLevelEntry[];
  getContinueLevel(): CampaignLevelEntry | null;
}

export type HomeCampaignAction =
  | { readonly kind: 'tutorial' }
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
  readonly title: string;
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
  readonly title: string;
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
  profile: PlayerProfileV2,
): HomeCampaignAction {
  if (!profile.tutorial.completed) return { kind: 'tutorial' };

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

export function shouldShowDailyEntry(profile: PlayerProfileV2): boolean {
  return profile.campaign.completedLevelIds.includes('campaign-005');
}

export function shouldShowSettingsEntry(_profile: PlayerProfileV2): boolean {
  return true;
}

export function getHomeDailyAction(
  profile: PlayerProfileV2,
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
  language: SupportedLanguage,
): string | null {
  if (manuscriptIndex <= 0) return null;
  const manuscript = CAMPAIGN_MANUSCRIPTS[manuscriptIndex];
  const previous = CAMPAIGN_MANUSCRIPTS[manuscriptIndex - 1];
  return getUiCopy(language).archive.requirement(
    manuscript.requiredPreviousSolved,
    previous.roman,
  );
}

export function getManuscriptViewModels(
  manifest: readonly CampaignLevelEntry[],
  profile: PlayerProfileV2,
  language: SupportedLanguage = 'ru',
): readonly ManuscriptViewModel[] {
  const completed = new Set(profile.campaign.completedLevelIds);
  const copy = getUiCopy(language);

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
      title: copy.manuscripts[manuscript.id],
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
      requirementText: unlocked ? null : requirementForLockedManuscript(index, language),
      requiredForNext,
      promotedLevelIds: promoted.map((entry) => entry.id),
    };
  });

  const sealed: readonly SealedManuscriptViewModel[] = [
    {
      kind: 'sealed',
      id: 'sealed-v',
      roman: 'V',
      title: copy.archive.sealedTitle,
      interactive: false,
      progress: null,
      requirementText: null,
      promotedLevelIds: [],
    },
    {
      kind: 'sealed',
      id: 'sealed-vi',
      roman: 'VI',
      title: copy.archive.sealedTitle,
      interactive: false,
      progress: null,
      requirementText: null,
      promotedLevelIds: [],
    },
  ];

  return [...real, ...sealed];
}

import type { CampaignLevelEntry } from '../content/campaign/types';
import type { PlayerProfileV5 } from '../profile/types';
import type { DailyEntry } from '../content/daily/types';
import type { DailyTodaySnapshot } from '../daily/DailyService';
import type { DailyResultSummary } from '../profile/types';

export const HOME_SCENE_KEY = 'HomeScene';
export const LEVELS_SCENE_KEY = 'LevelSelectScene';
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
  | { readonly kind: 'locked' }
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

export function getHomeCampaignAction(
  campaign: MetaCampaignPort,
  profile: PlayerProfileV5,
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

export function shouldShowDailyEntry(_profile: PlayerProfileV5): boolean {
  return true;
}

export function isDailyUnlocked(profile: PlayerProfileV5): boolean {
  return profile.campaign.completedLevelIds.includes('campaign-005');
}

export function shouldAutoStartTutorial(profile: PlayerProfileV5): boolean {
  return !profile.tutorial.completed
    && profile.tutorial.completedLevelIds.length === 0
    && profile.tutorial.activePuzzle === null;
}

export function shouldShowSettingsEntry(_profile: PlayerProfileV5): boolean {
  return true;
}

export function getHomeDailyAction(
  profile: PlayerProfileV5,
  today: DailyTodaySnapshot | null,
): HomeDailyAction {
  if (!isDailyUnlocked(profile)) return { kind: 'locked' };
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

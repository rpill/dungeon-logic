import type { CampaignLevelEntry } from '../content/campaign/types';
import { createFreshPlayerProfile } from '../profile/PlayerProfile';
import { resetPlayerProfileForDev } from './PlayerProfileDevReset';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const campaign = Array.from({ length: 64 }, (_, index): CampaignLevelEntry => ({
  slot: index + 1,
  id: `campaign-${String(index + 1).padStart(3, '0')}`,
  level: {} as CampaignLevelEntry['level'],
}));

const fresh = createFreshPlayerProfile(campaign, 'en');
const dirty = {
  ...fresh,
  campaign: { ...fresh.campaign, completedLevelIds: campaign.slice(0, 20).map((entry) => entry.id) },
  daily: { ...fresh.daily, currentStreak: 7, bestStreak: 11, totalSolved: 12 },
  endless: { ...fresh.endless, completed: 99, nextFreshIndex: 100, currentStreak: 12, bestStreak: 18 },
  mastery: { rating: 3456 },
  hints: { ...fresh.hints, freeRemaining: 0, totalUsed: 42 },
  settings: { language: 'en' as const, musicEnabled: false, soundEnabled: false },
};

const reset = resetPlayerProfileForDev(dirty, campaign);
assert(reset.campaign.completedLevelIds.length === 0, 'DEV reset must clear Campaign progress.');
assert(reset.daily.totalSolved === 0 && reset.daily.bestStreak === 0, 'DEV reset must clear Daily progress.');
assert(reset.endless.completed === 0 && reset.endless.bestStreak === 0, 'DEV reset must clear Endless progress.');
assert(reset.mastery.rating === 1000, 'DEV reset must restore base Master Rating.');
assert(reset.hints.totalUsed === 0 && reset.hints.freeRemaining === 3, 'DEV reset must restore hint economy state.');
assert(reset.settings.language === 'en' && !reset.settings.musicEnabled && !reset.settings.soundEnabled, 'DEV reset must preserve language/audio settings.');

console.info('[Dungeon Logic] DEV player-profile reset sanity: PASS');

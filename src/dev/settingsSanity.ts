import type { CampaignLevelEntry } from '../content/campaign/types';
import { createFreshPlayerProfile } from '../profile/PlayerProfile';
import type { PlayerProfileStorage } from '../profile/PlayerProfileStorage';
import { PlayerProfileService } from '../profile/PlayerProfileService';
import type { PlayerProfileV4 } from '../profile/types';
import type { HelpReturnSceneKey } from '../help/HelpNavigation';
import { SETTINGS_SCENE_KEY, shouldShowSettingsEntry } from '../runtime/MetaSelectors';
import { SettingsService, detectVibrationSupport } from '../settings/SettingsService';
import { getSettingsRows } from '../settings/SettingsViewModel';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function entry(slot: number): CampaignLevelEntry {
  const id = `campaign-${String(slot).padStart(3, '0')}`;
  return {
    slot,
    id,
    level: {
      id,
      width: 1,
      height: 1,
      rowClues: [0],
      columnClues: [0],
      monsters: [],
      chests: [],
      blockers: [],
      doors: [],
      solution: ['.'],
    },
  };
}

class MemoryStorage implements PlayerProfileStorage {
  raw: unknown = null;
  saves: PlayerProfileV4[] = [];

  async load(): Promise<unknown | null> {
    return this.raw;
  }

  async save(profile: PlayerProfileV4): Promise<void> {
    this.raw = profile;
    this.saves.push(profile);
  }
}

async function main(): Promise<void> {
  const manifest = [entry(1), entry(2), entry(3), entry(4), entry(5), entry(6)];
  const storage = new MemoryStorage();
  const profileService = await PlayerProfileService.create(manifest, storage, { saveDelayMs: 60_000 });
  const settings = new SettingsService(profileService, { vibrationSupported: true });

  const helpReturnKey: HelpReturnSceneKey = SETTINGS_SCENE_KEY;
  assert(helpReturnKey === SETTINGS_SCENE_KEY, 'How to Play can return to SettingsScene.');
  assert(SETTINGS_SCENE_KEY === 'SettingsScene', 'Settings scene has a stable navigation key.');
  assert(shouldShowSettingsEntry(profileService.getProfile()), 'Settings is available from the first launch.');

  assert(settings.getSettings().language === 'ru', 'SettingsService exposes fresh profile settings.');
  assert(settings.isVibrationSupported(), 'Injected vibration capability is exposed.');
  assert(detectVibrationSupport({ vibrate: () => true }), 'Navigator-like vibrate function enables vibration capability.');
  assert(!detectVibrationSupport({}), 'Missing vibrate function disables vibration capability.');
  const supportedRows = getSettingsRows(settings.getSettings(), true);
  assert(supportedRows.map((row) => row.id).join(',') === 'music,sound,vibration,language,help,reset', 'Supported devices render the v1 settings rows in order.');
  const unsupportedRows = getSettingsRows(settings.getSettings(), false);
  assert(!unsupportedRows.some((row) => row.id === 'vibration'), 'Unsupported devices omit the vibration row entirely.');

  await settings.setMusicEnabled(false);
  await settings.setSoundEnabled(false);
  await settings.setVibrationEnabled(false);
  await settings.setLanguage('en');
  assert(!settings.getSettings().musicEnabled, 'Music setting updates immediately.');
  assert(!settings.getSettings().soundEnabled, 'Sound setting updates immediately.');
  assert(!settings.getSettings().vibrationEnabled, 'Vibration setting updates immediately when supported.');
  assert(settings.getSettings().language === 'en', 'Language setting updates immediately.');
  assert(storage.saves.at(-1)?.settings.language === 'en', 'Settings mutations flush through profile storage immediately.');

  profileService.update((profile) => ({
    ...profile,
    campaign: {
      completedLevelIds: ['campaign-001', 'campaign-002', 'campaign-003', 'campaign-004', 'campaign-005'],
      lastPlayedLevelId: 'campaign-006',
      levelResults: {
        'campaign-001': { bestTimeMs: 1111, minHintsUsed: 0, solveCount: 2, solvedWithoutHints: true },
      },
      drafts: {
        'campaign-006': {
          mode: 'campaign',
          puzzleId: 'campaign-006',
          cells: [['unknown']],
          activePlayMs: 700,
          hintsUsed: 1,
          startedAtMs: 123,
        },
      },
    },
    daily: {
      drafts: {},
      currentStreak: 4,
      bestStreak: 7,
      lastSolvedDate: '2026-09-08',
      totalSolved: 9,
      solvedDates: ['2026-09-08'],
      results: {
        '2026-09-08': { bestTimeMs: 2222, minHintsUsed: 0, solvedWithoutHints: true },
      },
    },
    hints: { freeRemaining: 0, totalUsed: 12 },
    ads: { campaignCompletionsSinceOpportunity: 2, lastInterstitialAtMs: 456 },
    totals: { activePlayMs: 98765 },
  }));

  assert(shouldShowSettingsEntry(profileService.getProfile()), 'Completing campaign-005 unlocks Settings on Home.');

  await settings.resetProgress();
  const reset = profileService.getProfile();
  const fresh = createFreshPlayerProfile(manifest);

  assert(reset.settings.musicEnabled === false, 'Reset preserves music preference.');
  assert(reset.settings.soundEnabled === false, 'Reset preserves sound preference.');
  assert(reset.settings.vibrationEnabled === false, 'Reset preserves vibration preference.');
  assert(reset.settings.language === 'en', 'Reset preserves language preference.');
  assert(reset.campaign.completedLevelIds.length === 0, 'Reset clears campaign completions.');
  assert(reset.campaign.lastPlayedLevelId === null, 'Reset clears last played campaign level.');
  assert(Object.keys(reset.campaign.levelResults).length === 0, 'Reset clears campaign result history.');
  assert(Object.keys(reset.campaign.drafts).length === 0, 'Reset clears all saved Campaign level drafts.');
  assert(!reset.tutorial.completed, 'Reset relocks Tutorial for a fresh progression state.');
  assert(reset.tutorial.completedLevelIds.length === 0, 'Reset clears Tutorial completions.');
  assert(reset.tutorial.activePuzzle === null, 'Reset clears active Tutorial puzzle.');
  assert(reset.daily.totalSolved === 0 && reset.daily.solvedDates.length === 0, 'Reset clears Daily history.');
  assert(reset.daily.currentStreak === 0 && reset.daily.bestStreak === 0, 'Reset clears Daily streaks.');
  assert(reset.hints.freeRemaining === fresh.hints.freeRemaining && reset.hints.freeRemaining === 3, 'Reset restores exactly three free hints.');
  assert(reset.hints.totalUsed === 0, 'Reset clears total hint usage.');
  assert(reset.ads.campaignCompletionsSinceOpportunity === 0 && reset.ads.lastInterstitialAtMs === null, 'Reset clears ad counters.');
  assert(reset.totals.activePlayMs === 0, 'Reset clears accumulated active play time.');
  assert(storage.saves.at(-1)?.settings.language === 'en', 'Reset flushes preserved settings with the fresh progression state.');

  const unsupportedStorage = new MemoryStorage();
  const unsupportedProfile = await PlayerProfileService.create(manifest, unsupportedStorage, { saveDelayMs: 60_000 });
  const unsupported = new SettingsService(unsupportedProfile, { vibrationSupported: false });
  await unsupported.setVibrationEnabled(false);
  assert(!unsupported.isVibrationSupported(), 'Unsupported devices report no vibration capability.');
  assert(unsupported.getSettings().vibrationEnabled, 'Unsupported devices do not mutate hidden vibration preference.');

  console.info('[Dungeon Logic] Settings sanity: persisted toggles + capability + reset semantics passed');
}

void main();

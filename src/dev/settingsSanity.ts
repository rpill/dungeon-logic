import type { CampaignLevelEntry } from '../content/campaign/types';
import type { PlayerProfileStorage } from '../profile/PlayerProfileStorage';
import { PlayerProfileService } from '../profile/PlayerProfileService';
import type { PlayerProfile } from '../profile/types';
import type { HelpReturnSceneKey } from '../help/HelpNavigation';
import { SETTINGS_SCENE_KEY, shouldShowSettingsEntry } from '../runtime/MetaSelectors';
import { SettingsService } from '../settings/SettingsService';
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
  saves: PlayerProfile[] = [];

  async load(): Promise<unknown | null> {
    return this.raw;
  }

  async save(profile: PlayerProfile): Promise<void> {
    this.raw = profile;
    this.saves.push(profile);
  }
}

async function main(): Promise<void> {
  const manifest = [entry(1), entry(2), entry(3), entry(4), entry(5), entry(6)];
  const storage = new MemoryStorage();
  const profileService = await PlayerProfileService.create(manifest, storage, { saveDelayMs: 60_000 });
  const settings = new SettingsService(profileService);

  const helpReturnKey: HelpReturnSceneKey = SETTINGS_SCENE_KEY;
  assert(helpReturnKey === SETTINGS_SCENE_KEY, 'How to Play can return to SettingsScene.');
  assert(SETTINGS_SCENE_KEY === 'SettingsScene', 'Settings scene has a stable navigation key.');
  assert(shouldShowSettingsEntry(profileService.getProfile()), 'Settings is available from the first launch.');

  assert(settings.getSettings().language === 'ru', 'SettingsService exposes fresh profile settings.');
  assert(!('vibrationEnabled' in settings.getSettings()), 'Vibration is removed from persisted player settings.');
  const rows = getSettingsRows(settings.getSettings(), settings.getSettings().language);
  assert(
    rows.map((row) => row.id).join(',') === 'music,sound,language,tutorial,help',
    'Settings renders only Music, Sound, Language, Tutorial, and Rules.',
  );
  assert(rows.find((row) => row.id === 'help')?.label === 'ПРАВИЛА', 'Rules replaces the duplicate How to Play entry.');


  await settings.setMusicEnabled(false);
  await settings.setSoundEnabled(false);
  await settings.setLanguage('en');
  assert(!settings.getSettings().musicEnabled, 'Music setting updates immediately.');
  assert(!settings.getSettings().soundEnabled, 'Sound setting updates immediately.');
  assert(settings.getSettings().language === 'en', 'Language setting updates immediately.');
  assert(storage.saves.length === 0, 'Settings mutations must not wait on immediate cloud/profile flushes.');
  await profileService.flush();
  assert(storage.saves.length === 1, 'Coalesced Settings persistence flushes the latest state once.');
  assert(storage.saves.at(-1)?.settings.language === 'en', 'Deferred Settings persistence keeps the latest language.');





  console.info('[Dungeon Logic] Settings sanity: redesigned rows + persistence passed');
}

void main();

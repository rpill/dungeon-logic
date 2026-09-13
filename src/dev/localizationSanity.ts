import type { CampaignLevelEntry } from '../content/campaign/types';
import { TUTORIAL_MANIFEST } from '../content/tutorial/manifest';
import { getHelpRules } from '../help/HelpRules';
import { resolveSupportedLanguage } from '../i18n/Language';
import { getUiCopy } from '../i18n/UiCopy';
import { createOnboardingFlow } from '../onboarding/OnboardingFlow';
import { createFreshPlayerProfile } from '../profile/PlayerProfile';
import type { PlayerProfileStorage } from '../profile/PlayerProfileStorage';
import { PlayerProfileService } from '../profile/PlayerProfileService';
import type { PlayerProfileV4 } from '../profile/types';
import { createPuzzleToolbarState } from '../runtime/PuzzleUiState';
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
  raw: unknown;

  constructor(raw: unknown = null) {
    this.raw = raw;
  }

  async load(): Promise<unknown | null> {
    return this.raw;
  }

  async save(profile: PlayerProfileV4): Promise<void> {
    this.raw = profile;
  }
}

async function main(): Promise<void> {
  assert(resolveSupportedLanguage('ru') === 'ru', 'ru maps to Russian.');
  assert(resolveSupportedLanguage('ru-RU') === 'ru', 'ru-RU maps to Russian.');
  assert(resolveSupportedLanguage('RU-ru') === 'ru', 'Russian language matching is case-insensitive.');
  assert(resolveSupportedLanguage('en') === 'en', 'en maps to English.');
  assert(resolveSupportedLanguage('de') === 'en', 'Unsupported platform languages fall back to English.');
  assert(resolveSupportedLanguage('') === 'en', 'Empty platform language falls back to English.');
  assert(resolveSupportedLanguage(null) === 'en', 'Missing platform language falls back to English.');

  const manifest = [entry(1)];
  const freshEnglishStorage = new MemoryStorage();
  const freshEnglish = await PlayerProfileService.create(
    manifest,
    freshEnglishStorage,
    { saveDelayMs: 60_000, defaultLanguage: 'en' },
  );
  assert(freshEnglish.getProfile().settings.language === 'en', 'Fresh profile seeds platform-resolved English.');

  const savedRussian = createFreshPlayerProfile(manifest);
  const existingRussian = await PlayerProfileService.create(
    manifest,
    new MemoryStorage(savedRussian),
    { saveDelayMs: 60_000, defaultLanguage: 'en' },
  );
  assert(existingRussian.getProfile().settings.language === 'ru', 'Saved supported language overrides platform default.');

  const invalidSaved = {
    ...savedRussian,
    settings: {
      ...savedRussian.settings,
      language: 'de',
    },
  };
  const invalidFallback = await PlayerProfileService.create(
    manifest,
    new MemoryStorage(invalidSaved),
    { saveDelayMs: 60_000, defaultLanguage: 'en' },
  );
  assert(invalidFallback.getProfile().settings.language === 'en', 'Invalid saved language falls back to platform default.');

  const ruCopy = getUiCopy('ru');
  const enCopy = getUiCopy('en');
  assert(ruCopy.home.chooseLevel === 'ВЫБРАТЬ УРОВЕНЬ', 'Russian Home copy is available.');
  assert(enCopy.home.chooseLevel === 'CHOOSE LEVEL', 'English Home copy is available.');
  assert(ruCopy.common.levels === 'УРОВНИ' && enCopy.common.levels === 'LEVELS', 'Main campaign browser is named Levels in both locales.');
  assert(ruCopy.home.levelsProgress(15, 64) === 'Уровни · 15 / 64', 'Russian Home campaign progress uses Levels terminology.');
  assert(enCopy.home.levelsProgress(15, 64) === 'Levels · 15 / 64', 'English Home campaign progress uses Levels terminology.');
  assert(ruCopy.game.wall !== enCopy.game.wall, 'Toolbar copy differs by locale.');
  assert(ruCopy.game.levelTitle(3) === 'УРОВЕНЬ 3', 'Russian Game title shows only the current campaign level number.');
  assert(enCopy.game.levelTitle(3) === 'LEVEL 3', 'English Game title shows only the current campaign level number.');
  assert(ruCopy.game.tutorialTitle(2, 5) === 'ОБУЧЕНИЕ 2 / 5', 'Russian Tutorial title is localized.');
  assert(enCopy.game.tutorialTitle(2, 5) === 'TUTORIAL 2 / 5', 'English Tutorial title is localized.');
  assert(ruCopy.game.tutorialComplete === 'ОБУЧЕНИЕ ПРОЙДЕНО\nТы знаешь все правила подземелья.', 'Russian Tutorial completion copy is localized.');
  assert(enCopy.game.tutorialComplete === 'TUTORIAL COMPLETE\nYou know every dungeon rule.', 'English Tutorial completion copy is localized.');

  const ruRules = getHelpRules('ru');
  const enRules = getHelpRules('en');
  assert(ruRules.map((rule) => rule.id).join(',') === enRules.map((rule) => rule.id).join(','), 'Help rule IDs/order are locale invariant.');
  assert(ruRules[0]?.title === 'ЦЕЛЬ' && enRules[0]?.title === 'GOAL', 'Help titles are localized.');

  assert(TUTORIAL_MANIFEST[0]?.id === 'tutorial-001', 'Localization sanity uses the stable Tutorial manifest.');
  const ruFlow = createOnboardingFlow('tutorial-001', 'ru');
  const enFlow = createOnboardingFlow('tutorial-001', 'en');
  assert(ruFlow.length === enFlow.length && ruFlow.length > 0, 'Onboarding step count is locale invariant.');
  assert(ruFlow[0]?.target === enFlow[0]?.target, 'Onboarding targets are locale invariant.');
  assert(JSON.stringify(ruFlow[1]?.target === 'board-cells' ? ruFlow[1].cells : []) === JSON.stringify(enFlow[1]?.target === 'board-cells' ? enFlow[1].cells : []), 'Onboarding target cells are locale invariant.');
  assert(ruFlow[0]?.message !== enFlow[0]?.message, 'Onboarding prose is localized.');

  const ruSettingsRows = getSettingsRows(savedRussian.settings, 'ru');
  const enSettingsRows = getSettingsRows({ ...savedRussian.settings, language: 'en' }, 'en');
  assert(ruSettingsRows.find((row) => row.id === 'music')?.label === 'МУЗЫКА', 'Settings rows localize Russian labels.');
  assert(enSettingsRows.find((row) => row.id === 'music')?.label === 'MUSIC', 'Settings rows localize English labels.');
  assert(ruSettingsRows.find((row) => row.id === 'music')?.value === 'ВКЛ', 'Settings rows localize Russian toggle values.');
  assert(enSettingsRows.find((row) => row.id === 'music')?.value === 'ON', 'Settings rows localize English toggle values.');
  assert(ruSettingsRows.find((row) => row.id === 'language')?.value === 'РУССКИЙ', 'Russian language row shows a human language name.');
  assert(enSettingsRows.find((row) => row.id === 'language')?.value === 'ENGLISH', 'English language row shows a human language name.');

  const ruToolbar = createPuzzleToolbarState('wall', true, true, 2, true, 'ru');
  const enToolbar = createPuzzleToolbarState('wall', true, true, 2, true, 'en');
  assert(ruToolbar.buttons.find((button) => button.id === 'wall')?.label === 'СТЕНА', 'Russian toolbar labels are localized.');
  assert(enToolbar.buttons.find((button) => button.id === 'wall')?.label === 'WALL', 'English toolbar labels are localized.');
  assert(ruToolbar.buttons.find((button) => button.id === 'hint')?.label === 'ПОДСКАЗКА ×2', 'Russian free-hint label is localized.');
  assert(enToolbar.buttons.find((button) => button.id === 'hint')?.label === 'HINT ×2', 'English free-hint label is localized.');

  console.info('[Dungeon Logic] Localization sanity: platform language + profile precedence passed');
}

void main();

import type { CampaignLevelEntry } from '../content/campaign/types';
import { getHelpRules } from '../help/HelpRules';
import { resolveSupportedLanguage } from '../i18n/Language';
import { getUiCopy } from '../i18n/UiCopy';
import { createOnboardingFlow } from '../onboarding/OnboardingFlow';
import { createFreshPlayerProfile } from '../profile/PlayerProfile';
import type { PlayerProfileStorage } from '../profile/PlayerProfileStorage';
import { PlayerProfileService } from '../profile/PlayerProfileService';
import type { PlayerProfileV1 } from '../profile/types';
import { createOnboardingMessages } from '../runtime/GameLaunch';
import { getManuscriptViewModels } from '../runtime/MetaSelectors';
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
    chapterId: 'graveyard',
    onboarding: [],
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

  async save(profile: PlayerProfileV1): Promise<void> {
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
  assert(ruCopy.game.wall !== enCopy.game.wall, 'Toolbar copy differs by locale.');

  const ruRules = getHelpRules('ru');
  const enRules = getHelpRules('en');
  assert(ruRules.map((rule) => rule.id).join(',') === enRules.map((rule) => rule.id).join(','), 'Help rule IDs/order are locale invariant.');
  assert(ruRules[0]?.title === 'ЦЕЛЬ' && enRules[0]?.title === 'GOAL', 'Help titles are localized.');

  const ruFlow = createOnboardingFlow('campaign-001', 'ru');
  const enFlow = createOnboardingFlow('campaign-001', 'en');
  assert(ruFlow.length === enFlow.length && ruFlow.length > 0, 'Onboarding step count is locale invariant.');
  assert(ruFlow[0]?.target === enFlow[0]?.target, 'Onboarding targets are locale invariant.');
  assert(JSON.stringify(ruFlow[0]?.target === 'board-cells' ? ruFlow[0].cells : []) === JSON.stringify(enFlow[0]?.target === 'board-cells' ? enFlow[0].cells : []), 'Onboarding target cells are locale invariant.');
  assert(ruFlow[0]?.message !== enFlow[0]?.message, 'Onboarding prose is localized.');

  const onboardingData = {
    level: manifest[0]!.level,
    context: { mode: 'campaign', campaignLevelId: 'campaign-001' },
    onboarding: ['row-column-clues'],
    contextualOnboarding: false,
  } as const;
  assert(createOnboardingMessages(onboardingData, 'ru')[0]?.includes('Числа'), 'Campaign onboarding ID resolves Russian copy.');
  assert(createOnboardingMessages(onboardingData, 'en')[0]?.includes('Numbers'), 'Campaign onboarding ID resolves English copy.');

  const manuscriptManifest = Array.from({ length: 14 }, (_, index) => entry(index + 1));
  const manuscriptProfile = createFreshPlayerProfile(manuscriptManifest, 'ru');
  const ruManuscripts = getManuscriptViewModels(manuscriptManifest, manuscriptProfile, 'ru');
  const enManuscripts = getManuscriptViewModels(manuscriptManifest, manuscriptProfile, 'en');
  assert(ruManuscripts[0]?.title === 'Азбука' && enManuscripts[0]?.title === 'Primer', 'Manuscript display titles are localized.');
  assert(ruManuscripts[1]?.requirementText?.includes('Завершите 6') === true, 'Locked manuscript has Russian requirement copy.');
  assert(enManuscripts[1]?.requirementText?.includes('Complete 6') === true, 'Locked manuscript has English requirement copy.');

  const ruSettingsRows = getSettingsRows(savedRussian.settings, true, 'ru');
  const enSettingsRows = getSettingsRows({ ...savedRussian.settings, language: 'en' }, true, 'en');
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

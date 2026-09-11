import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const boot = readFileSync(new URL('../src/scenes/BootScene.ts', import.meta.url), 'utf8');
const home = readFileSync(new URL('../src/scenes/HomeScene.ts', import.meta.url), 'utf8');
const selectors = readFileSync(new URL('../src/runtime/MetaSelectors.ts', import.meta.url), 'utf8');
const campaignService = readFileSync(new URL('../src/campaign/CampaignService.ts', import.meta.url), 'utf8');
const copy = readFileSync(new URL('../src/i18n/UiCopy.ts', import.meta.url), 'utf8');
const stats = readFileSync(new URL('../src/scenes/StatsScene.ts', import.meta.url), 'utf8');

assert(
  boot.includes('shouldAutoStartTutorial(profileService.getProfile())'),
  'Boot must detect a truly fresh profile before showing Home.',
);
assert(
  boot.includes("this.scene.start('GameScene', createTutorialGameSceneData(started));"),
  'Fresh launch must enter Tutorial directly.',
);
assert(
  selectors.includes("| { readonly kind: 'locked' }"),
  'Daily must have an explicit visible-but-locked Home state.',
);
assert(
  home.includes("action.kind === 'locked'"),
  'Home must render Daily as a disabled visible button before its unlock.',
);
assert(
  !home.includes('if (dailyVisible) {'),
  'Statistics must no longer disappear behind the Daily visibility gate.',
);

assert(
  campaignService.includes("? ['daily']"),
  'Campaign level 5 should unlock only Daily now that Statistics is visible from the start.',
);
assert(
  !copy.includes('ОТКРЫТО: DAILY И СТАТИСТИКА') && !copy.includes('UNLOCKED: DAILY AND STATISTICS'),
  'Unlock copy must not claim Statistics was hidden before campaign-005.',
);

assert(
  stats.includes('isDailyUnlocked(profile)') && stats.includes('dailyUnlocked ? () => this.scene.start(DAILY_SCENE_KEY) : undefined'),
  'Statistics may be visible early, but its Daily card must not bypass the campaign-005 Daily lock.',
);

console.info('First-run Home sanity: PASS');

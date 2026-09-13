import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const home = readFileSync(new URL('../src/scenes/HomeScene.ts', import.meta.url), 'utf8');

assert(home.includes('createHomeHubCard'), 'Home must use the compact hub-card renderer.');
assert(home.includes("variant: 'primary'"), 'Home must render a prominent Continue card.');
assert(home.includes("variant: 'tile'"), 'Home must render Levels and Daily as paired tiles.');
assert(home.includes("variant: 'wide'"), 'Home must reserve a wide Endless card.');
assert(home.includes("label: copy.common.levels"), 'Home must keep a Levels card.');
assert(home.includes("label: 'DAILY'"), 'Home must keep a Daily card.');
assert(home.includes("label: copy.home.endless"), 'Home must render the Endless card.');
assert(home.includes('createHomeSettingsButton'), 'Home must expose Settings through a top-right gear button.');
assert(home.includes('const cardGap = narrow ? 10 : 16'), 'Home must use a compact paired-card gap.');
assert(home.includes('const desktopTileSide'), 'Desktop Home must derive a square tile side from available viewport height.');
assert(/Math\.max\(180, Math\.min\(\s*260,/.test(home), 'Desktop Home must cap square mode cards at a compact 260px side.');
assert(home.includes('const iconSize = narrow ? 30 : Math.min(82, options.width * 0.31);'), 'Desktop Levels and Daily icons must scale up inside compact square cards.');
assert(home.includes('const tileHeight = narrow'), 'Home must keep mobile tile height independent from desktop square tiles.');
assert(home.includes('const mobileTileHeight = compactHeight ? 102 : 116;'), 'Mobile Levels and Daily cards must be tall enough to keep comfortable bottom padding.');
assert(home.includes('y: options.y + options.height * (narrow ? 0.35 : 0.41),'), 'Mobile Levels progress bar must sit higher to preserve bottom inset inside the card.');
assert(home.includes(': tileWidth;'), 'Desktop Levels and Daily cards must be square (height equals width).');
assert(!home.includes('STATS_SCENE_KEY'), 'Home must no longer include the Statistics entry.');
assert(!home.includes('copy.common.tutorial'), 'Home must no longer show a standalone Tutorial button.');
assert(!home.includes('copy.common.howToPlay'), 'Home must no longer show a standalone How to Play button.');

assert(home.includes('subtitle: entry === undefined\n        ? `${completedCampaign} / ${campaignTotal}`\n        : copy.levelSelect.level(entry.slot),'), 'Continue card must show only the current level in its subtitle.');
assert(home.includes('progress: { completed: completedCampaign, total: levels.length, label: copy.levelSelect.progress(completedCampaign, levels.length) }'), 'Levels card must receive completed/total progress data and localized progress text.');
assert(home.includes('drawHomeCardProgress'), 'Levels card must render a dedicated progress bar.');
assert(home.includes('HOME_PROGRESS_FILL = 0xf0bd63'), 'Home Levels progress must use the yellow campaign fill.');
assert(!home.includes('HOME_PROGRESS_AVAILABLE_FILL'), 'Home Levels progress must not render the green available-reach segment.');

console.info('[Dungeon Logic] Home hub layout sanity: PASS');

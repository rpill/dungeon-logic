import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const home = readFileSync(new URL('../src/scenes/HomeScene.ts', import.meta.url), 'utf8');

assert(home.includes('createHomeHubCard'), 'Home must use the compact hub-card renderer.');
assert(home.includes("variant: 'primary'"), 'Home must render a prominent Continue card.');
assert(home.includes("variant: 'tall'"), 'Home must render Levels and Daily as paired material cards.');
assert(home.includes("variant: 'wide'"), 'Home must reserve a wide Endless card.');
assert(home.includes('createHomeModeCard'), 'Home must render mode entries through the dedicated material-card renderer.');
assert(home.includes('activeAccent: !solved'), 'Available unsolved Daily must keep a distinct active accent.');
assert(home.includes("label: copy.common.levels"), 'Home must keep a Levels card.');
assert(home.includes("label: 'DAILY'"), 'Home must keep a Daily card.');
assert(home.includes("label: copy.home.endless"), 'Home must render the Endless card.');
assert(home.includes("endless: 'home-menu-icon-endless'"), 'Home Endless card must use a dedicated endless icon asset.');
assert(!home.includes("scene.add.text(iconX, options.y, '∞'"), 'Home Endless card must not render a raw infinity glyph anymore.');
assert(home.includes('createHomeSettingsButton'), 'Home must expose Settings through a top-right gear button.');
assert(home.includes('const naturalCardGap = narrow ? 10 : 16'), 'Home must use a compact paired-card gap.');
assert(home.includes('const naturalDesktopTileSide'), 'Desktop Home must define a natural compact square tile size.');
assert(home.includes('const naturalStackHeight'), 'Home must treat logo and cards as one cohesive vertical stack.');
assert(home.includes('const availableHeight'), 'Home must derive layout from the usable viewport height.');
assert(home.includes('const stackScale = Math.min(1, availableHeight / naturalStackHeight);'), 'Home must scale the whole stack down on short viewports instead of clipping it.');
assert(home.includes('STICKY_BOTTOM_INSET_REGISTRY_KEY'), 'Home must explicitly opt in to the shared sticky bottom inset hook.');
assert(home.includes("const desiredCenterRatio = narrow ? 0.47 : 0.5;"), 'Home stack must be vertically centered, with a slight optical lift on mobile.');
assert(home.includes('const cardSectionGap'), 'Home cards must keep a compact shared gap so the stack reads as one unit.');
assert(home.includes('const iconSize = narrow ? 30 : Math.min(82, options.width * 0.31);'), 'Desktop Levels and Daily icons must scale up inside compact square cards.');
assert(home.includes('const naturalTileHeight = narrow'), 'Home must keep mobile tile height independent from desktop square tiles.');
assert(home.includes('const naturalMobileTileHeight = compactHeight ? 102 : 116;'), 'Mobile Levels and Daily cards must keep their comfortable natural height before stack scaling.');
assert(home.includes('y: options.y + options.height * (narrow ? 0.35 : 0.41),'), 'Mobile Levels progress bar must sit higher to preserve bottom inset inside the card.');
assert(home.includes(': naturalTileWidth;'), 'Desktop Levels and Daily cards must be square before responsive stack scaling.');
assert(!home.includes('STATS_SCENE_KEY'), 'Home must no longer include the Statistics entry.');
assert(!home.includes('copy.common.tutorial'), 'Home must no longer show a standalone Tutorial button.');
assert(!home.includes('copy.common.howToPlay'), 'Home must no longer show a standalone How to Play button.');

assert(home.includes('subtitle: entry === undefined\n        ? `${completedCampaign} / ${campaignTotal}`\n        : copy.levelSelect.level(entry.slot),'), 'Continue card must show only the current level in its subtitle.');
assert(home.includes('progress: { completed: completedCampaign, total: levels.length, label: copy.levelSelect.progress(completedCampaign, levels.length) }'), 'Levels card must receive completed/total progress data and localized progress text.');
assert(home.includes('drawHomeCardProgress'), 'Levels card must render a dedicated progress bar.');
assert(home.includes('HOME_PROGRESS_FILL = 0xf0bd63'), 'Home Levels progress must use the yellow campaign fill.');
assert(!home.includes('HOME_PROGRESS_AVAILABLE_FILL'), 'Home Levels progress must not render the green available-reach segment.');

console.info('[Dungeon Logic] Home hub layout sanity: PASS');

import fs from 'node:fs';

const strip = fs.readFileSync('src/runtime/MasteryStrip.ts', 'utf8');
const scene = fs.readFileSync('src/scenes/MasteryScene.ts', 'utf8');
const boot = fs.readFileSync('src/scenes/BootScene.ts', 'utf8');
const card = fs.readFileSync('src/runtime/HomeHubModeCard.ts', 'utf8');

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

expect(strip.includes("createHomeHubModeCard"), 'MasteryStrip must reuse createHomeHubModeCard');
expect(strip.includes("variant: 'wide'"), 'MasteryStrip must use the native wide card variant');
expect(!strip.includes('mastery-strip-home'), 'MasteryStrip must not use a custom mastery strip texture');
expect(!strip.includes('scene.add.nineslice'), 'MasteryStrip must not implement its own NineSlice geometry');

expect(scene.includes('createMasteryRequirementPanel'), 'MasteryScene must use the dedicated generated requirements panel');
expect(scene.includes('mastery.nextRank'), 'MasteryScene requirements panel title logic must remain intact');
expect(!scene.includes("createHomeHubModeCard(this, {"), 'MasteryScene must no longer reuse the stretched hub card for the requirements panel');

expect(!boot.includes("mastery-strip-home"), 'BootScene must not preload the retired mastery strip texture');
expect(boot.includes('preloadMasteryRequirementPanelAssets'), 'BootScene must preload the generated mastery requirements panel asset');
expect(boot.includes('preloadMasteryRequirementRowPanelAssets'), 'BootScene must preload the generated requirement row panel asset');
expect(card.includes('readonly interactive?: boolean'), 'HomeHubModeCard must support non-interactive display reuse');
expect(card.includes('const interactive = options.interactive ?? true'), 'HomeHubModeCard must default interactive mode to true');

console.log('mastery native UI sanity: PASS');

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

expect(scene.includes("createHomeHubModeCard"), 'MasteryScene must reuse createHomeHubModeCard for the requirements panel');
expect(scene.includes("variant: 'wide'"), 'MasteryScene requirements must use the native wide card variant');
expect(!scene.includes("'mastery-panel'"), 'MasteryScene must not use the custom mastery panel texture');

expect(!boot.includes("mastery-strip-home"), 'BootScene must not preload the retired mastery strip texture');
expect(!boot.includes("mastery-panel"), 'BootScene must not preload the retired mastery panel texture');
expect(card.includes('readonly interactive?: boolean'), 'HomeHubModeCard must support non-interactive display reuse');
expect(card.includes('const interactive = options.interactive ?? true'), 'HomeHubModeCard must default interactive mode to true');

console.log('mastery native UI sanity: PASS');

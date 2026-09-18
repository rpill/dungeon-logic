import fs from 'node:fs';

const renderer = fs.readFileSync('src/runtime/HomeHubModeCard.ts', 'utf8');
const home = fs.readFileSync('src/scenes/HomeScene.ts', 'utf8');
const strip = fs.readFileSync('src/runtime/MasteryStrip.ts', 'utf8');

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

expect(
  renderer.includes('): Phaser.GameObjects.NineSlice {'),
  'createHomeHubModeCard must preserve the legacy direct NineSlice return contract.',
);
expect(
  renderer.includes('return surface;'),
  'createHomeHubModeCard must return the surface itself.',
);
expect(
  !renderer.includes('export interface HomeHubModeCardHandle'),
  'HomeHubModeCard must not wrap the surface in a handle object.',
);
expect(
  home.includes('const cardWidth = card.displayWidth;') && home.includes('const cardHeight = card.displayHeight;'),
  'Home still relies on direct NineSlice displayWidth/displayHeight.',
);
expect(
  !strip.includes('card.surface'),
  'MasteryStrip must use the direct card surface API, not a wrapper.',
);

console.log('home hub card API contract sanity: PASS');

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
function assert(condition, message) { if (!condition) throw new Error(message); }
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const game = readFileSync(resolve(root, 'src/scenes/GameScene.ts'), 'utf8');
assert(game.includes('let onboardingPanel: Phaser.GameObjects.NineSlice | null = null;'), 'Tutorial panel should use a NineSlice plaque handle.');
assert(game.includes('onboardingPanel = createModalPanel(this, {') && game.includes("variant: 'wide'"), 'Tutorial panel must use the wide modal plaque asset.');
assert(game.includes('const verticalPadding = narrowScreen ? 18 : 20;'), 'Tutorial panel must keep readable vertical padding.');
assert(game.includes('narrowScreen ? 82 : 96,'), 'Tutorial panel must enforce the taller minimum height.');
console.info('[Dungeon Logic] tutorial panel home-style sanity: PASS');

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
function assert(condition, message) { if (!condition) throw new Error(message); }
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const game = readFileSync(resolve(root, 'src/scenes/GameScene.ts'), 'utf8');
const rankup = readFileSync(resolve(root, 'src/runtime/MasteryRankUpOverlay.ts'), 'utf8');
assert(game.includes('const panel = createModalPanel(this, {') && game.includes("variant: 'wide'"), 'Reset dialog must use the wide modal plaque asset.');
assert(rankup.includes('const panel = createModalPanel(scene, {') && rankup.includes("variant: 'rankup'"), 'Rank-up overlay must use the dedicated rank-up plaque asset.');
assert(rankup.includes("import { createModalPanel } from './ModalPanel';"), 'Rank-up overlay must import ModalPanel helper.');
assert(game.includes("import { createModalPanel } from '../runtime/ModalPanel';"), 'GameScene must import ModalPanel helper.');
console.info('[Dungeon Logic] dialog home-style sanity: PASS');

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
function assert(condition, message) { if (!condition) throw new Error(message); }
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const game = readFileSync(resolve(root, 'src/scenes/GameScene.ts'), 'utf8');
assert(game.includes('const height = 248;'), 'Reset modal must use the 248px layout.');
assert(game.includes('const titleY = -height / 2 + 66;'), 'Reset title must have a generous top inset.');
assert(game.includes("const dialogCopy = this.add.text(0, -4, copy.game.resetBody"), 'Reset body copy must sit below the title with clear spacing.');
assert(game.includes('const buttonY = height / 2 - 46;'), 'Reset buttons must retain a safe bottom inset.');
console.info('[Dungeon Logic] reset modal layout sanity: PASS');

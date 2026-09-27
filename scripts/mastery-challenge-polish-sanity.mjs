import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const copy = readFileSync(resolve(root, 'src/i18n/UiCopy.ts'), 'utf8');
const strip = readFileSync(resolve(root, 'src/runtime/MasteryStrip.ts'), 'utf8');
const seal = readFileSync(resolve(root, 'src/runtime/MasterySeal.ts'), 'utf8');
const scene = readFileSync(resolve(root, 'src/scenes/MasteryScene.ts'), 'utf8');
const game = readFileSync(resolve(root, 'src/scenes/GameScene.ts'), 'utf8');
const home = readFileSync(resolve(root, 'src/scenes/HomeScene.ts'), 'utf8');

assert(copy.includes("endless: 'ИСПЫТАНИЕ'"), 'RU Home mode name must be ИСПЫТАНИЕ.');
assert(copy.includes("endlessTitle: (ordinal) => `ИСПЫТАНИЕ ${ordinal}`"), 'RU game title must use ИСПЫТАНИЕ.');
assert(copy.includes("endless: 'Испытание: решено'"), 'RU Mastery requirement must use Испытание and completed-puzzle wording.');
assert(game.includes('copy.game.endlessTitle'), 'GameScene must render localized Challenge title.');
assert(home.includes('profile.endless.currentStreak') && home.includes('profile.endless.bestStreak'), 'Home Challenge card must show current and best streak.');

assert(strip.includes('createSlateSurface'), 'Mastery strip must use the shared matte slate surface.');
assert(strip.includes('sealSize = Math.min(options.height * 0.76'), 'Mastery strip seal must keep safe padding.');

assert(seal.includes("textureVariant === 'small' ? 0.96 : 0.88"), 'Mastery seals must render inside a safe padded image box.');
assert(seal.includes('showRankPlaque?: boolean'), 'Mastery seal must support plaque-free small rank-path icons.');

assert(scene.includes("'home-menu-icon-daily'"), 'Mastery condition rows must use a Daily icon.');
assert(scene.includes("'home-menu-icon-endless'"), 'Mastery condition rows must use the challenge infinity icon.');
assert(scene.includes('drawRequirementProgress'), 'Mastery requirement rows must render a real progress track.');
assert(scene.includes('createMasteryRequirementPanel'), 'Mastery requirements panel must use the shared slate shell.');
assert(scene.includes('createMasterySeal(this, {'), 'Current rank must retain its distinct emblem.');

console.info('[Dungeon Logic] Mastery + Challenge polish sanity: PASS');

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
assert(copy.includes("endlessTitle: (ordinal) => `ИСПЫТАНИЕ · ${ordinal}`"), 'RU game title must use ИСПЫТАНИЕ.');
assert(copy.includes("endless: 'Испытание: чистая серия'"), 'RU Mastery requirement must use Испытание.');
assert(copy.includes("endlessCleanStreak: (streak) => `ЧИСТАЯ СЕРИЯ: ${streak}`"), 'Game copy must expose persistent clean streak HUD copy.');
assert(game.includes('challengeStreakText'), 'GameScene must render a dedicated challenge streak HUD text.');
assert(game.includes('copy.game.endlessCleanStreak'), 'GameScene streak HUD must use localized clean streak copy.');
assert(home.includes('copy.home.endlessStreak(profile.endless.currentCleanStreak, profile.endless.bestCleanStreak)'), 'Home Challenge card must show current and best clean streak.');

assert(strip.includes('createHeaderActionButton'), 'Mastery strip must use the shared header/material action button.');
assert(!strip.includes("scene.add.image(chevronX"), 'Mastery strip must not use a naked chevron image.');
assert(strip.includes('sealSize = Math.min(options.height * 0.7'), 'Mastery strip seal must keep safe padding.');

assert(/imageSize = options\.size \* \(showRankPlaque \? 0\.82 : 0\.88\)/.test(seal), 'Mastery seals must render inside a safe padded image box.');
assert(seal.includes('showRankPlaque?: boolean'), 'Mastery seal must support plaque-free small rank-path icons.');

assert(scene.includes("'home-menu-icon-daily'"), 'Mastery condition rows must use a Daily icon.');
assert(scene.includes("'home-menu-icon-endless'"), 'Mastery condition rows must use the challenge infinity icon.');
assert(scene.includes('drawRequirementProgress'), 'Mastery requirement rows must render a real progress track.');
assert(scene.includes('createHomeHubModeCard') && scene.includes("variant: 'wide'"), 'Mastery requirements panel must reuse the native wide-card component.');
assert(scene.includes('createMasterySeal(this, {'), 'Mastery rank path must use mastery seals instead of plain circles.');

console.info('[Dungeon Logic] Mastery + Challenge polish sanity: PASS');

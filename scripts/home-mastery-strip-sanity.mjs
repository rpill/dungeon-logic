import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const home = readFileSync(resolve(root, 'src/scenes/HomeScene.ts'), 'utf8');
const selectors = readFileSync(resolve(root, 'src/runtime/MetaSelectors.ts'), 'utf8');
const stripPath = resolve(root, 'src/runtime/MasteryStrip.ts');

assert(home.includes('const mastery = getMasterySnapshot(profile);'), 'Home must derive Mastery snapshot from the current profile.');
assert(home.includes('naturalMasteryHeight'), 'Home stack must reserve height for the Mastery strip.');
assert(home.includes('createMasteryStrip'), 'Home must render the Mastery strip.');
assert(home.includes('MASTERY_SCENE_KEY'), 'Home must navigate Mastery strip to MasteryScene.');
assert(selectors.includes("export const MASTERY_SCENE_KEY = 'MasteryScene';"), 'MetaSelectors must expose the Mastery scene key.');
assert(existsSync(stripPath), 'MasteryStrip component must exist.');

const strip = existsSync(stripPath) ? readFileSync(stripPath, 'utf8') : '';
assert(strip.includes('createMasterySeal'), 'Mastery strip must render the labyrinth seal.');
assert(strip.includes('setInteractive({ useHandCursor: true })') || strip.includes('createHeaderActionButton'), 'Mastery strip must be clickable.');
assert(strip.includes('createHomeHubModeCard') && strip.includes("variant: 'wide'"), 'Mastery strip must reuse the native Home wide-card component.');
assert(strip.includes('UI_ICON_KEYS.back'), 'Mastery strip chevron must reuse an existing UI icon.');
assert(strip.includes('const sealSize = Math.min(options.height * 1.26, 90);'), 'Mastery strip seal must be about 1.5x larger than before.');
assert(strip.includes('const arrowSize = Math.max(20, Math.min(26, options.height * 0.38));'), 'Mastery strip chevron must be larger.');
assert(strip.includes('const arrowX = right - Math.max(28, options.width * 0.06);'), 'Mastery strip chevron must sit further left inside the strip.');

const primary = readFileSync(resolve(root, 'src/runtime/PrimaryActionButton.ts'), 'utf8');
const material = readFileSync(resolve(root, 'src/runtime/MaterialActionButton.ts'), 'utf8');
assert(!primary.includes('mastery'), 'PrimaryActionButton must remain unrelated to Mastery.');
assert(!material.includes('mastery'), 'MaterialActionButton must remain unrelated to Mastery.');

console.info('[Dungeon Logic] Home mastery strip sanity: PASS');

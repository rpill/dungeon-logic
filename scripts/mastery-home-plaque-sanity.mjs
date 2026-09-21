import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const panelTs = readFileSync(resolve(root, 'src/runtime/MasteryRequirementPanel.ts'), 'utf8');
const rowTs = readFileSync(resolve(root, 'src/runtime/MasteryRequirementRowPanel.ts'), 'utf8');

const homeTall = resolve(root, 'public/assets/ui/home_hub_card_tall_generated_trimmed.webp');
const rowAsset = resolve(root, 'public/assets/ui/mastery_requirement_row_flat.webp');

assert(existsSync(homeTall), 'Mastery main panel must reuse the approved Home tall plaque asset.');
assert(existsSync(rowAsset), 'Flat mastery requirement row asset must exist.');
assert(panelTs.includes('home_hub_card_tall_generated_trimmed.webp'), 'Mastery main panel must load the approved Home tall plaque asset.');
assert(rowTs.includes('mastery_requirement_row_flat.webp'), 'Mastery row runtime must load the flat dark row asset.');
assert(panelTs.includes('const SLICE_X = 52;') && panelTs.includes('const SLICE_Y = 52;'), 'Main mastery panel must use Home-compatible nine-slice constants.');
assert(rowTs.includes('const SLICE_X = 28;') && rowTs.includes('const SLICE_Y = 28;'), 'Flat row panel must use compact nine-slice constants.');
assert(statSync(rowAsset).size < 20000, 'Flat row asset should stay compact.');

console.info('[Dungeon Logic] Mastery home plaque sanity: PASS');

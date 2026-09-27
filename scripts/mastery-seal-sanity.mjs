import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const boot = readFileSync(resolve(root, 'src/scenes/BootScene.ts'), 'utf8');
const componentPath = resolve(root, 'src/runtime/MasterySeal.ts');

for (const asset of [
  'public/assets/ui/mastery_seal_stone.webp',
  'public/assets/ui/mastery_seal_steel.webp',
  'public/assets/ui/mastery_seal_gold.webp',
  'public/assets/ui/mastery_seal_master.webp',
]) {
  assert(existsSync(resolve(root, asset)), `Mastery seal fallback asset must exist: ${asset}`);
}

assert(existsSync(componentPath), 'MasterySeal component must exist.');
assert(boot.includes('preloadMasterySealAssets(this);'), 'BootScene must preload Mastery seal assets.');

const component = existsSync(componentPath) ? readFileSync(componentPath, 'utf8') : '';
for (const [rank, key] of [
  ['I', 'mastery-seal-rank-i'],
  ['II', 'mastery-seal-rank-ii'],
  ['III', 'mastery-seal-rank-iii'],
  ['IV', 'mastery-seal-rank-iv'],
  ['V', 'mastery-seal-rank-v'],
  ['VI', 'mastery-seal-rank-vi'],
  ['VII', 'mastery-seal-rank-vii'],
  ['VIII', 'mastery-seal-rank-viii'],
  ['MASTER', 'mastery-seal-rank-master'],
]) {
  assert(component.includes(`${rank}: '${key}'`), `Rank ${rank} must have its own texture key.`);
}

for (const rank of ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'master']) {
  assert(component.includes(`assets/ui/mastery_seal_rank_${rank}.webp`), `Rank ${rank} must load its individual emblem.`);
}
assert(component.includes('resolveTextureKey(options.rank, textureVariant)'), 'Seal rendering must resolve the texture directly by rank.');
assert(component.includes('showRankPlaque?: boolean'), 'Mastery seal must support plaque-free small rank-path icons.');
assert(component.includes('MASTER'), 'Mastery seal component must render rank plaque text dynamically.');

console.info('[Dungeon Logic] Mastery seal sanity: PASS');

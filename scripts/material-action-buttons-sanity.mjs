import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = process.cwd();
const materialPath = resolve(root, 'src/runtime/MaterialActionButton.ts');
const homeMenu = readFileSync(resolve(root, 'src/runtime/HomeMenuButton.ts'), 'utf8');
const header = readFileSync(resolve(root, 'src/runtime/HeaderActionButton.ts'), 'utf8');
const daily = readFileSync(resolve(root, 'src/scenes/DailyScene.ts'), 'utf8');
const game = readFileSync(resolve(root, 'src/scenes/GameScene.ts'), 'utf8');

for (const asset of [
  'public/assets/ui/secondary_button_normal.webp',
  'public/assets/ui/danger_button_normal.webp',
]) {
  assert(existsSync(resolve(root, asset)), `Material button asset must exist: ${asset}`);
}

assert(existsSync(materialPath), 'Shared MaterialActionButton renderer must exist.');
const material = readFileSync(materialPath, 'utf8');
assert(material.includes("type MaterialButtonVariant = 'secondary' | 'danger'"), 'Material buttons must expose secondary and danger variants.');
assert(material.includes('MATERIAL_BUTTON_SLICE_X = 56'), 'Material buttons must preserve the primary CTA end-cap geometry.');
assert(material.includes('MATERIAL_BUTTON_FRAME_INSET = 24'), 'Material buttons must preserve the primary CTA crop geometry.');
assert(material.includes("assets/ui/secondary_button_normal.webp"), 'Secondary asset must preload through the shared renderer.');
assert(material.includes("assets/ui/danger_button_normal.webp"), 'Danger asset must preload through the shared renderer.');

assert(homeMenu.includes('createMaterialActionButton'), 'Legacy menu-button API must render with the new filled material button system.');
assert(!homeMenu.includes('HOME_MENU_FRAME_KEYS[state]'), 'Action buttons must no longer depend on the old outline frame state renderer.');
assert(daily.includes("variant: 'secondary'"), 'Daily leaderboard action must use a secondary filled button.');
assert(game.includes("variant: 'danger'"), 'Game reset/confirm actions must use the danger material button.');
assert(header.includes('drawMaterialButtonBackground'), 'Header actions must use the filled material visual language instead of outline pills.');

console.info('[Dungeon Logic] Material action buttons sanity: PASS');

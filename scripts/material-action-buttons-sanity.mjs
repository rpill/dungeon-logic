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
  'public/assets/ui/action_slate_m1.png',
  'public/assets/ui/action_red_m1.png',
]) {
  assert(existsSync(resolve(root, asset)), `Material button asset must exist: ${asset}`);
}


assert(existsSync(materialPath), 'Shared MaterialActionButton renderer must exist.');
const material = readFileSync(materialPath, 'utf8');
assert(material.includes("type MaterialButtonVariant = 'secondary' | 'danger'"), 'Material buttons must expose secondary and danger variants.');
assert(material.includes('MATERIAL_BUTTON_SLICE_X = 56'), 'Material buttons must preserve the primary CTA end-cap geometry.');
assert(material.includes("MATERIAL_BUTTON_FRAME = 'button-body-full'"), 'Material buttons must keep one stable frame key per loaded texture.');
assert(material.includes('MATERIAL_BUTTON_VISIBLE_FRAME_Y') && material.includes('MATERIAL_BUTTON_VISIBLE_FRAME_HEIGHT'), 'Material buttons must trim transparent vertical canvas padding so secondary and danger have equal visible height.');
assert(!material.includes('MATERIAL_BUTTON_FRAME_INSET'), 'Material buttons must not re-apply the legacy end-cap crop.');
assert(!material.includes('MATERIAL_COMPACT_SURFACE_SCALE'), 'Compact secondary/danger buttons must use their declared height instead of hidden visual-only scaling.');
assert(material.includes("scene.load.image(MATERIAL_BUTTON_KEYS.secondary, 'assets/ui/action_slate_m1.png')"), 'Secondary must preload one stable normal texture.');
assert(material.includes("scene.load.image(MATERIAL_BUTTON_KEYS.danger, 'assets/ui/action_red_m1.png')"), 'Danger must preload one stable normal texture.');
assert(!material.includes("material-button-secondary-hover"), 'Secondary states must not swap independently drawn textures.');
assert(!material.includes("material-button-danger-hover"), 'Danger states must not swap independently drawn textures.');
assert(material.includes('setTintMode(Phaser.TintModes.ADD)'), 'Material buttons must use tint-based hover feedback on one stable texture.');
assert(!material.includes('surface.setTexture('), 'Material button states must never swap surface textures.');
assert(/getMaterialButtonContentY\([^)]*\)[\s\S]*?return y;/.test(material), 'Material button content must be vertically centered in the declared button bounds.');
assert(header.includes('getMaterialButtonContentY'), 'Header action icon/text must use the shared optical content center.');
assert(game.includes('createMaterialButtonSurface(this, {'), 'Gameplay toolbar must render from the shared textured material surface.');

assert(homeMenu.includes('createMaterialActionButton'), 'Legacy menu-button API must render with the new filled material button system.');
assert(!homeMenu.includes('HOME_MENU_FRAME_KEYS[state]'), 'Action buttons must no longer depend on the old outline frame state renderer.');
assert(daily.includes("variant: 'secondary'"), 'Daily leaderboard action must use a secondary filled button.');
assert(game.includes("variant: 'danger'"), 'Game reset/confirm actions must use the danger material button.');
assert(header.includes('HEADER_ACTION_SQUARE_TEXTURE_KEYS.secondary'), 'Header icon actions must use the square textured secondary-button asset.');

console.info('[Dungeon Logic] Material action buttons sanity: PASS');

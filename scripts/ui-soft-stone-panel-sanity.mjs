import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const panel = fs.readFileSync(path.join(root, 'src/ui/UiPanel.ts'), 'utf8');
const mastery = fs.readFileSync(path.join(root, 'src/scenes/MasteryScene.ts'), 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(mastery.includes("variant: 'panel'"), 'Mastery requirement shell must use the shared panel variant.');
assert(!panel.includes("MASTERY_PANEL_KEY = 'mastery-requirements-panel'"), 'Shared panel variant must not depend on the old metallic mastery panel asset.');
assert(panel.includes("options.variant === 'panel'"), 'UiPanel must expose a dedicated soft-stone panel branch.');
assert(panel.includes('scene.add.graphics()'), 'Soft-stone panel must be drawn procedurally instead of using metallic NineSlice art.');
assert(panel.includes('UI_THEME.colors.surface.raised'), 'Soft-stone panel must use the shared raised surface token.');
assert(panel.includes('UI_THEME.colors.surface.base'), 'Soft-stone panel must use the shared base surface token.');
assert(panel.includes('UI_THEME.colors.border.normal'), 'Soft-stone panel must use the shared quiet border token.');
assert(!panel.includes('setScale(surfaceScale)'), 'Soft-stone panel must not stretch a raster shell vertically.');

console.info('[Dungeon Logic] Soft-stone UI panel sanity: PASS');

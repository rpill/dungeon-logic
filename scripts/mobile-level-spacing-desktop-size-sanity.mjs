import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const layout = readFileSync(resolve(root, 'src/runtime/ResponsiveLayout.ts'), 'utf8');
const scene = readFileSync(resolve(root, 'src/scenes/LevelSelectScene.ts'), 'utf8');

assert(layout.includes('const portraitSideMargin = 12;'), 'Portrait mobile cards must use a small side margin near screen edges.');
assert(layout.includes("const gapX = portrait ? (compactPortrait ? 24 : 28) : 12;"), 'Regular portrait keeps a 28px center gap while short browser viewports compact to 24px.');
assert(layout.includes('const compactPortrait = portrait && viewport.height < 720;'), 'Short portrait browser viewport must have an explicit compact layout mode.');
assert(layout.includes('const gapY = portrait ? (compactPortrait ? 12 : 18) : 10;'), 'Regular portrait keeps 18px row spacing while short browser viewports compact to 12px.');
assert(layout.includes('const portraitCardScale = compactPortrait ? 0.88 : 0.93;'), 'Regular portrait keeps its breathing-room scale while short browser viewports compact further.');
assert(layout.includes('const cardSize = portrait'), 'Portrait mobile card size must apply its own scale without affecting landscape or desktop.');
assert(layout.includes('const effectiveGapX = gapX;'), 'Portrait mobile columns must keep a compact fixed gap instead of dumping leftover width into the middle.');
assert(layout.includes('const startX = (viewport.width - totalWidth) / 2 + cardSize / 2;'), 'Portrait mobile columns must remain centered as one compact grid block.');
assert(layout.includes('const maxCardSize = viewport.width >= 1600 && viewport.height >= 860 ? 134 : 108;'), 'Desktop level cards must keep the larger responsive cap.');
assert(layout.includes('Math.min(maxCardSize, maxCardFromWidth)'), 'Desktop level card sizing must apply the responsive cap against available width.');
assert(!layout.includes('Math.min(72, maxCardFromWidth, maxCardFromHeight)'), 'Desktop cards must not be shrunk back to the old 72px height-fitting cap.');
assert(scene.includes("from '../runtime/HeaderActionButton'"), 'Mobile pager arrows must use the shared HeaderActionButton component.');
assert(scene.includes('UI_ICON_KEYS.back'), 'Pager arrows must use the standard back-arrow icon asset.');
assert(scene.includes('createHeaderActionButton(this, {'), 'Pager arrows must render with a proper shared button background.');
assert(scene.includes('button.icon.setRotation(Math.PI);'), 'Right pager button must rotate the standard back icon instead of using a text glyph.');
assert(!scene.includes("direction < 0 ? '‹' : '›'"), 'Pager must no longer use bare text arrow glyphs.');

console.info('[Dungeon Logic] Mobile spacing + pager buttons + desktop card size sanity: PASS');

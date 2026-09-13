import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const scene = readFileSync('src/scenes/LevelSelectScene.ts', 'utf8');
const layout = readFileSync('src/runtime/ResponsiveLayout.ts', 'utf8');
const icons = readFileSync('src/runtime/UiIcons.ts', 'utf8');

assert(scene.includes('copy.home.continue'), 'Levels primary action must use the short localized Continue label.');
assert(!scene.includes('copy.levelSelect.continueLevel('), 'Levels primary action must not append the level number to Continue.');
assert(scene.includes('const hoverOverlay = this.drawRoundedOverlay('), 'Playable level cards must use a rounded overlay for hover feedback.');
assert(scene.includes('0x40577f'), 'Level-card hover overlay must reuse the gameplay blue selector palette.');
assert(scene.includes('hoverOverlay.setAlpha(0.16).setVisible(true)'), 'Hover overlay must use the subtle resting-hover opacity.');
assert(scene.includes('hoverOverlay.setAlpha(0.28).setVisible(true)'), 'Pressed level-card overlay must strengthen without changing the border.');
assert(!scene.includes('hoverStrokeWidth'), 'Level hover must not change border thickness.');
assert(!scene.includes('pressedStrokeWidth'), 'Level press must not change border thickness.');
assert(scene.includes('copy.levelSelect.progress('), 'Levels screen must show a dedicated completed-level progress label.');
assert(!scene.includes('drawGridPanel(layout);'), 'Levels screen must not wrap the whole grid in a large panel.');
assert(scene.includes('drawLevelSectionDividers(layout, items.length);'), 'Levels screen must insert small block dividers between 8-level groups.');
assert(scene.includes('const SECTION_LINE_COLOR = 0xf0bd63;'), 'Block separators must use the gold concept color.');
assert(scene.includes('createScrollIndicator('), 'Levels screen must show a right-side scroll indicator when scrolling is available.');
assert(scene.includes('SCROLLBAR_TRACK_FILL'), 'Scroll indicator must use a themed dark-blue track.');
assert(scene.includes('SCROLLBAR_THUMB_FILL'), 'Scroll indicator must use a themed gold thumb.');

assert(scene.includes('WHEEL_SCROLL_SCALE'), 'Wheel scroll must use a reduced sensitivity scale.');
assert(scene.includes('WHEEL_SCROLL_MAX_STEP'), 'Wheel scroll must clamp unusually large wheel deltas.');
assert(!scene.includes('applyScrollY(camera.scrollY + deltaY);'), 'Wheel scroll must not apply raw deltaY directly.');
assert(scene.includes('WHEEL_SCROLL_EASE'), 'Wheel scroll must define frame-by-frame easing.');
assert(scene.includes('wheelTargetY'), 'Wheel scroll must accumulate into a target position.');
assert(scene.includes('Phaser.Math.Linear(camera.scrollY, wheelTargetY'), 'Wheel scroll camera must ease toward its target instead of jumping.');
assert(scene.includes('wheelTargetY = camera.scrollY;'), 'Direct drag interactions must cancel wheel inertia.');
assert(scene.includes('CURRENT_GLOW_TEXTURE_SCALE'), 'Current level must rasterize its blur above display resolution for smooth downsampling.');

assert(layout.includes('const blockGap ='), 'Responsive Level Select layout must reserve a dedicated gap between 8-level blocks.');
assert(layout.includes('blockBreaksBeforeRow'), 'Each card row must be shifted by prior 8-level block gaps.');
assert(scene.includes('shadowBlur'), 'Current level glow must use a true blurred canvas shadow.');
assert(scene.includes('addCanvas('), 'Current level glow must be cached as a smooth canvas texture.');
assert(!scene.includes('const glowLayers = ['), 'Current level glow must not use banded rectangle layers.');
assert(scene.includes('PROGRESS_AVAILABLE_FILL'), 'Progress bar must show the short green unlocked-range segment.');
assert(scene.includes('fillRoundedRect('), 'Level Select chrome must use rounded primitives.');
assert(scene.includes('UI_ICON_KEYS.lock'), 'Locked level cards must use the shared lock icon.');
assert(scene.includes('UI_ICON_KEYS.question'), 'Unstarted level cards must use the shared question icon.');
assert(scene.includes('UI_ICON_KEYS.check'), 'Completed level cards must use the shared check icon.');
assert(scene.includes('drawCompletedCheck('), 'Completed levels must use the lightweight corner check treatment.');
assert(!scene.includes('drawStatusBadgeIcon('), 'Level status icons must not sit in square badge boxes.');
assert(layout.includes('readonly progressLabelY: number;'), 'Responsive Level Select layout must expose progress label positioning.');
assert(layout.includes('readonly progressBarY: number;'), 'Responsive Level Select layout must expose progress bar positioning.');
assert(layout.includes('const progressLabelY = continueY + continueHeight / 2 +'), 'Progress summary must sit directly below Continue.');
assert(layout.includes('const headerBottom = progressBarY + progressBarHeight / 2 +'), 'Card grid must start below the progress bar.');
assert(layout.includes('continueWidth: Math.min(shortViewport ? 240 : 260'), 'Desktop Continue button must stay compact.');
assert(icons.includes("scene.load.svg(UI_ICON_KEYS.lock, 'assets/ui/icons/lock.svg', rasterizeConfig);"), 'Lock icon must preload as a shared UI SVG.');
assert(icons.includes("scene.load.svg(UI_ICON_KEYS.check, 'assets/ui/icons/check.svg', rasterizeConfig);"), 'Check icon must preload as a shared UI SVG.');
assert(icons.includes("scene.load.svg(UI_ICON_KEYS.question, 'assets/ui/icons/question.svg', rasterizeConfig);"), 'Question icon must preload as a shared UI SVG.');


assert(layout.includes("const gapX = viewportClass === 'wide' ? 16 : 14;"), 'Desktop/landscape level cards need wider horizontal spacing.');
assert(layout.includes("viewport.height >= 860 ? 34 : viewport.height >= 760 ? 28 : 20"), 'Desktop level groups need a larger reserved block gap around separators.');
assert(layout.includes("const gapX = 16;"), 'Portrait level cards need 16px horizontal spacing.');
assert(layout.includes("const gapY = 22;"), 'Portrait level rows need 22px vertical spacing.');
assert(layout.includes("viewport.height < 620 ? 26 : 32"), 'Portrait 8-level blocks need a larger separator gap.');
assert(scene.includes('const backingRadius = iconSize * 0.39;'), 'Completed check needs a dark backing only behind its transparent check cutout.');
assert(scene.includes('this.add.circle(x, y, backingRadius, 0x0d1b2d, 1);'), 'Completed check backing must be fill-only with no outer stroke.');

assert(scene.includes('const SCROLLBAR_THUMB_MAX_RATIO = 0.36;'), 'Scrollbar thumb must have a compact maximum size instead of filling most of the track.');
assert(scene.includes('thumbHitArea'), 'Scrollbar must expose a wider invisible hit area for mouse/touch dragging.');
assert(scene.includes('this.input.setDraggable(scrollbar.thumbHitArea);'), 'Scrollbar thumb hit area must be registered as draggable.');
assert(scene.includes(".on('drag',"), 'Scrollbar must update scroll position while its thumb is dragged.');
assert(scene.includes("scrollbar.trackHitArea.on('pointerdown'"), 'Scrollbar track must support click-to-jump interaction.');

console.info('[Dungeon Logic] Level Select visual polish sanity: progress + state icons + dividers + draggable scrollbar passed');

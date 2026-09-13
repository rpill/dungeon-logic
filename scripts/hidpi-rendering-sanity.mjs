import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const main = readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8');
const runtime = readFileSync(new URL('../src/runtime/HiDpiRendering.ts', import.meta.url), 'utf8');

assert(main.includes("from './runtime/HiDpiRendering'"), 'main.ts must install the HiDPI rendering bridge.');
assert(main.includes('installHiDpiRendering(game)'), 'main.ts must install HiDPI after creating Phaser.Game.');
assert(runtime.includes('MAX_RENDER_DPR = 2'), 'HiDPI DPR must be capped at 2 for mobile performance.');
assert(runtime.includes('canvas.style.width'), 'HiDPI bridge must preserve logical CSS width.');
assert(runtime.includes('canvas.style.height'), 'HiDPI bridge must preserve logical CSS height.');
assert(runtime.includes('renderer.resize(physicalWidth, physicalHeight)'), 'WebGL drawing buffer must use physical pixel dimensions.');
assert(runtime.includes('renderer.setProjectionMatrix(logicalWidth, logicalHeight)'), 'Projection must remain in logical CSS-pixel coordinates.');
assert(runtime.includes('setScissorBox'), 'Camera scissors must be scaled to physical pixels.');
assert(runtime.includes('Phaser.Scale.Events.RESIZE'), 'HiDPI bridge must reapply after Phaser resize events.');
assert(runtime.includes('GameObjectFactory.prototype'), 'HiDPI bridge must raise Phaser Text texture resolution globally.');
assert(runtime.includes('resolution: getRenderDpr()'), 'Phaser Text textures must render at the same capped DPR as the framebuffer.');

const styleHeightIndex = runtime.indexOf('canvas.style.height = `${logicalHeight}px`;');
const updateCenterIndex = runtime.indexOf('game.scale.updateCenter();');
const updateBoundsIndex = runtime.indexOf('game.scale.updateBounds();');
const displayScaleIndex = runtime.indexOf('game.scale.displayScale.set(');
const rendererResizeIndex = runtime.indexOf('renderer.resize(physicalWidth, physicalHeight)');

assert(updateCenterIndex > styleHeightIndex, 'Sharp resize must recenter immediately after HiDPI changes the CSS size.');
assert(updateBoundsIndex > updateCenterIndex, 'Sharp resize must refresh canvas bounds after recentering.');
assert(displayScaleIndex > updateBoundsIndex, 'Sharp resize must refresh input displayScale from the new bounds.');
assert(rendererResizeIndex > displayScaleIndex, 'ScaleManager DOM/input geometry must be synchronized before the physical buffer resize.');

console.info('[Dungeon Logic] HiDPI rendering sanity: logical layout + DPR buffer + one-event sharp resize synchronization passed');

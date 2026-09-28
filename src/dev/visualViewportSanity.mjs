import { strict as assert } from 'node:assert';

const {
  getBrowserViewportSize,
  installVisualViewportSync,
} = await import('../runtime/VisualViewportBridge.ts');

const viewport = getBrowserViewportSize({
  innerWidth: 412,
  innerHeight: 780,
  visualViewport: { width: 412, height: 612, offsetLeft: 0, offsetTop: 22 },
});
assert.deepEqual(viewport, { width: 412, height: 612 }, 'Visual viewport must win over stale layout viewport height.');

const listeners = new Map();
const visualListeners = new Map();
const documentListeners = new Map();
const css = new Map();
const style = {
  setProperty(name, value) { css.set(name, value); },
};
let frame = null;
const fakeWindow = {
  innerWidth: 412,
  innerHeight: 780,
  visualViewport: {
    width: 412,
    height: 780,
    offsetLeft: 0,
    offsetTop: 0,
    addEventListener(name, handler) { visualListeners.set(name, handler); },
    removeEventListener(name) { visualListeners.delete(name); },
  },
  addEventListener(name, handler) { listeners.set(name, handler); },
  removeEventListener(name) { listeners.delete(name); },
  requestAnimationFrame(handler) { frame = handler; return 1; },
  cancelAnimationFrame() { frame = null; },
  setTimeout(handler) { handler(); return 1; },
  clearTimeout() {},
};
const fakeDocument = {
  documentElement: { style },
  addEventListener(name, handler) { documentListeners.set(name, handler); },
  removeEventListener(name) { documentListeners.delete(name); },
};
const resizeCalls = [];
const game = {
  scale: {
    width: 412,
    height: 780,
    resize(width, height) { resizeCalls.push([width, height]); this.width = width; this.height = height; },
  },
};

const dispose = installVisualViewportSync(game, { window: fakeWindow, document: fakeDocument });
assert.equal(css.get('--app-viewport-width'), '412px');
assert.equal(css.get('--app-viewport-height'), '780px');
assert.equal(css.get('--app-viewport-top'), '0px');
assert.deepEqual(resizeCalls, [], 'Initial dimensions matching Phaser must not trigger a redundant resize.');

fakeWindow.visualViewport.height = 612;
fakeWindow.visualViewport.offsetTop = 22;
visualListeners.get('resize')?.();
assert.ok(frame, 'Visual viewport resize schedules a synchronized frame.');
frame();
assert.equal(css.get('--app-viewport-height'), '612px', 'CSS app height follows visible browser viewport.');
assert.equal(css.get('--app-viewport-top'), '0px', 'Embedded game canvas must not be physically shifted by VisualViewport offsetTop.');
assert.equal(css.get('--browser-ui-inset-top'), '0px', 'Browser chrome is handled by VisualViewport size, not a guessed top gutter.');
assert.equal(css.get('--browser-ui-inset-bottom'), '0px', 'Browser chrome is handled by VisualViewport size, not a guessed bottom gutter.');
assert.deepEqual(resizeCalls, [[412, 612]], 'Phaser receives the visible viewport dimensions.');

visualListeners.get('scroll')?.();
frame?.();
assert.deepEqual(resizeCalls, [[412, 612]], 'Unchanged visual viewport does not restart scenes through duplicate Phaser resize events.');

assert.ok(listeners.has('resize'), 'Window resize fallback is installed.');
assert.ok(listeners.has('orientationchange'), 'Orientation changes trigger viewport synchronization.');
assert.ok(documentListeners.has('fullscreenchange'), 'Fullscreen exit/entry triggers viewport synchronization.');

fakeWindow.visualViewport.height = 780;
visualListeners.get('resize')?.();
frame?.();
fakeWindow.visualViewport.height = 612;
visualListeners.get('resize')?.();
frame?.();
assert.deepEqual(
  resizeCalls,
  [[412, 612], [412, 780], [412, 612]],
  'Fullscreen round-trip returns to the exact same logical size without accumulated scaling.',
);
assert.equal(css.get('--app-viewport-height'), '612px', 'Fullscreen round-trip restores the exact visible CSS height.');

dispose();
assert.equal(visualListeners.size, 0, 'Visual viewport listeners are cleaned up.');
assert.equal(listeners.size, 0, 'Window listeners are cleaned up.');
assert.equal(documentListeners.size, 0, 'Document listeners are cleaned up.');

console.info('[Dungeon Logic] Visual viewport sanity passed');

const { readFileSync } = await import('node:fs');
const mainSource = readFileSync(new URL('../main.ts', import.meta.url), 'utf8');
const styleSource = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
const indexSource = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
const hiDpiSource = readFileSync(new URL('../runtime/HiDpiRendering.ts', import.meta.url), 'utf8');
assert.ok(mainSource.includes('getBrowserViewportMetrics'), 'main.ts must size and position Phaser from the visible browser viewport on startup.');
assert.ok(mainSource.includes('applyBrowserViewportCss'), 'main.ts must size #app before Phaser boots.');
assert.ok(mainSource.includes('installVisualViewportSync'), 'main.ts must keep Phaser synchronized after browser chrome/fullscreen changes.');
assert.ok(mainSource.includes('mode: Phaser.Scale.NONE'), 'Manual viewport resizing must use Phaser Scale.NONE, not compete with Scale.RESIZE.');
assert.ok(mainSource.includes('autoCenter: Phaser.Scale.NO_CENTER'), 'A full-parent canvas must not accumulate centering margins across fullscreen transitions.');
assert.ok(!mainSource.includes('mode: Phaser.Scale.RESIZE'), 'Viewport bridge and Phaser RESIZE mode must not both own canvas sizing.');
assert.ok(styleSource.includes('var(--app-viewport-height, 100dvh)'), '#app CSS must use the synchronized visible viewport height.');
assert.ok(styleSource.includes('var(--app-viewport-width, 100vw)'), '#app CSS must use the synchronized visible viewport width.');
assert.ok(!styleSource.includes('top: var(--app-viewport-top'), '#app must stay anchored to the iframe instead of VisualViewport offsetTop.');
assert.ok(indexSource.includes('viewport-fit=cover'), 'Viewport meta must expose device safe areas to CSS env() insets.');
assert.ok(!hiDpiSource.includes('game.scale.updateCenter()'), 'HiDPI rendering must not mutate centering margins during fullscreen resize cycles.');

for (const scenePath of [
  '../scenes/HomeScene.ts',
  '../scenes/LevelSelectScene.ts',
  '../scenes/DailyScene.ts',
  '../scenes/MasteryScene.ts',
  '../scenes/SettingsScene.ts',
  '../scenes/GameScene.ts',
]) {
  const source = readFileSync(new URL(scenePath, import.meta.url), 'utf8');
  assert.ok(source.includes('Phaser.Scale.Events.RESIZE'), `${scenePath} must respond to synchronized Phaser viewport resizes.`);
}

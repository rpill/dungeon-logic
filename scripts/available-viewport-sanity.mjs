import { readFileSync } from 'node:fs';
import {
  calculateAvailableViewport,
  readCssSafeAreaInsets,
  STICKY_BOTTOM_INSET_REGISTRY_KEY,
} from '../src/runtime/AvailableViewport.ts';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const full = calculateAvailableViewport(1280, 720);
assert(full.x === 0 && full.y === 0, 'Default viewport must start at the canvas origin.');
assert(full.width === 1280 && full.height === 720, 'Default viewport must preserve the full canvas size.');
assert(full.centerX === 640 && full.centerY === 360, 'Default viewport center must match the canvas center.');
assert(full.right === 1280 && full.bottom === 720, 'Default viewport edges must match the canvas edges.');

const inset = calculateAvailableViewport(1280, 720, {
  top: 20,
  right: 30,
  bottom: 100,
  left: 10,
});
assert(inset.x === 10 && inset.y === 20, 'Insets must shift the available viewport origin.');
assert(inset.width === 1240 && inset.height === 600, 'Insets must reduce available dimensions.');
assert(inset.centerX === 630 && inset.centerY === 320, 'Inset viewport center must be derived from the available rectangle.');
assert(inset.right === 1250 && inset.bottom === 620, 'Inset viewport edges must be derived from the available rectangle.');

const sanitized = calculateAvailableViewport(360, 540, {
  top: -10,
  bottom: Number.NaN,
  left: 9999,
  right: 9999,
});
assert(sanitized.x >= 0 && sanitized.y >= 0, 'Invalid inset values must never move the viewport outside the canvas.');
assert(sanitized.width >= 1 && sanitized.height >= 1, 'Extreme insets must keep a minimally usable rectangle.');
assert(sanitized.right <= 360 && sanitized.bottom <= 540, 'Extreme insets must be clamped inside the canvas.');

const fakeRoot = {
  getPropertyValue(name) {
    return name === '--safe-area-inset-top' ? '12px' : name === '--safe-area-inset-bottom' ? '18.5px' : '0px';
  },
};
const safe = readCssSafeAreaInsets(() => fakeRoot);
assert(safe.top === 12 && safe.bottom === 18.5, 'CSS safe-area reader must parse top and bottom inset variables.');
assert(safe.left === 0 && safe.right === 0, 'CSS safe-area reader must default absent side insets to zero.');

assert(STICKY_BOTTOM_INSET_REGISTRY_KEY === 'sticky-bottom-inset-px', 'Sticky inset registry key must be generic, not Home-specific.');

const home = readFileSync(new URL('../src/scenes/HomeScene.ts', import.meta.url), 'utf8');
assert(home.includes('calculateAvailableViewport'), 'Home must use the shared available viewport contract.');
assert(home.includes('STICKY_BOTTOM_INSET_REGISTRY_KEY'), 'Home must explicitly opt in to the optional sticky bottom inset.');
assert(!home.includes('HOME_BOTTOM_RESERVED_PX_REGISTRY_KEY'), 'Home must not keep a scene-specific sticky viewport contract.');

const game = readFileSync(new URL('../src/scenes/GameScene.ts', import.meta.url), 'utf8');
assert(game.includes('calculateAvailableViewport'), 'Game must use the shared available viewport contract.');
assert(game.includes('readCssSafeAreaInsets'), 'Game must consume safe-area insets through the shared viewport helper.');
assert(!game.includes("const readSafeArea ="), 'Game must not keep a private safe-area reader after migration.');
assert(!game.includes('STICKY_BOTTOM_INSET_REGISTRY_KEY'), 'Game must not reserve sticky-banner space.');

console.info('[Dungeon Logic] Available viewport sanity: PASS');

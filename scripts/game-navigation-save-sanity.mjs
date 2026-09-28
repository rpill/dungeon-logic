import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/scenes/GameScene.ts', import.meta.url), 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(!source.includes('await flushProfileState();'), 'Leaving gameplay must not wait for remote profile flush before navigation.');
const backgroundFlushes = source.match(/void flushProfileState\(\)\.catch/g) ?? [];
assert(backgroundFlushes.length >= 4, 'Gameplay persistence must continue in the background on leave/pause/visibility paths.');
console.info('[Dungeon Logic] game navigation save sanity: non-blocking navigation persistence PASS');

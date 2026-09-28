import { existsSync, readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const visuals = readFileSync(new URL('../src/view/MonsterVisuals.ts', import.meta.url), 'utf8');
const assets = readFileSync(new URL('../src/view/FixedObjectAssets.ts', import.meta.url), 'utf8');

assert(
  visuals.includes("export type MonsterSkinId = 'monster_pink' | 'ghost' | 'slime';"),
  'MonsterSkinId must include slime.',
);
assert(
  visuals.includes("1: ['monster_pink', 'ghost', 'slime']"),
  'Default monster visual pool must include slime.',
);
for (let i = 1; i <= 4; i += 1) {
  const nn = String(i).padStart(2, '0');
  assert(
    assets.includes(`{ key: 'monster-slime-${nn}', path: 'assets/monsters/slime_${nn}.webp' }`),
    `FixedObjectAssets must preload slime_${nn}.webp.`,
  );
  assert(
    existsSync(new URL(`../public/assets/monsters/slime_${nn}.webp`, import.meta.url)),
    `Missing public/assets/monsters/slime_${nn}.webp.`,
  );
}

console.info('Slime monster sanity: PASS');

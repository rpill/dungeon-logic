import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { decodeEndlessCatalog, type EndlessCatalogManifest } from '../content/endless/CatalogFormat';
import { getEndlessProgressionTarget } from '../content/endless/ProgressionPolicy';

function allowedSizes(ordinal: number): readonly number[] {
  const target = getEndlessProgressionTarget(ordinal) as ReturnType<typeof getEndlessProgressionTarget> & {
    readonly allowedSizes?: readonly number[];
  };
  return target.allowedSizes ?? [];
}

for (let ordinal = 1; ordinal <= 29; ordinal += 1) {
  assert.deepEqual(
    allowedSizes(ordinal),
    [6],
    `Endless ${ordinal} must stay on 6x6 during the opening runway.`,
  );
}

assert.deepEqual(allowedSizes(30), [8], 'Endless 30 starts the easy 8x8 phase.');
assert.deepEqual(allowedSizes(60), [8], 'Endless 60 finishes the easy 8x8 phase.');
assert.ok(
  getEndlessProgressionTarget(29).targetScore <= 8,
  'Opening runway must remain at the low end of Easy.',
);
assert.ok(
  getEndlessProgressionTarget(30).targetScore >= 14,
  '8x8 phase starts only after the small-board runway.',
);

const manifest = JSON.parse(
  readFileSync('public/content/endless/verified-levels-manifest.json', 'utf8'),
) as EndlessCatalogManifest;
const catalog = decodeEndlessCatalog(
  readFileSync('public/content/endless/verified-levels.bin'),
  manifest,
);

for (let index = 0; index < 29; index += 1) {
  assert.equal(catalog[index]?.size, 6, `Packed Endless ${index + 1} must be 6x6.`);
  assert.equal(catalog[index]?.difficultyBand, 'easy', `Packed Endless ${index + 1} must be Easy.`);
}
for (let index = 29; index < 60; index += 1) {
  assert.equal(catalog[index]?.size, 8, `Packed Endless ${index + 1} must be 8x8.`);
  assert.equal(catalog[index]?.difficultyBand, 'easy', `Packed Endless ${index + 1} must remain Easy.`);
}

const firstTwelve = catalog.slice(0, 12).map((entry) => entry.difficultyScore);
assert.ok(
  Math.max(...firstTwelve) - Math.min(...firstTwelve) <= 4,
  `First 12 Endless levels must have a tight score spread; got ${firstTwelve.join(',')}.`,
);

for (const [start, end] of [[0, 29], [29, 60]] as const) {
  const scores = catalog.slice(start, end).map((entry) => entry.difficultyScore);
  for (let index = 1; index < scores.length; index += 1) {
    assert.ok(
      scores[index] >= scores[index - 1],
      `Endless opening phase ${start + 1}-${end} must not regress: ${scores[index - 1]} -> ${scores[index]} at ordinal ${start + index + 1}.`,
    );
  }
}

console.info('[Dungeon Logic] Endless progression sanity: opening size/score runway passed');

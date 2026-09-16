import assert from 'node:assert/strict';

import { getEndlessProgressionTarget } from '../content/endless/ProgressionPolicy';

const opening = Array.from({ length: 12 }, (_, index) =>
  getEndlessProgressionTarget(index + 1).targetScore,
);

assert.ok(opening[0] <= 6, `Endless must open gently; got ${opening[0]}.`);
for (let index = 1; index < opening.length; index += 1) {
  assert.ok(
    opening[index] - opening[index - 1] <= 6,
    `Opening Endless must not spike suddenly: ${opening[index - 1]} -> ${opening[index]} at ${index + 1}.`,
  );
}

const longRun = Array.from({ length: 240 }, (_, index) =>
  getEndlessProgressionTarget(index + 13).targetScore,
);

const localPeaks = longRun.filter((score, index) =>
  index > 0 && index < longRun.length - 1 && score > longRun[index - 1] && score > longRun[index + 1],
);
const localTroughs = longRun.filter((score, index) =>
  index > 0 && index < longRun.length - 1 && score < longRun[index - 1] && score < longRun[index + 1],
);

assert.ok(localPeaks.length >= 6, `Endless long run must repeatedly rise and fall; peaks=${localPeaks.length}.`);
assert.ok(localTroughs.length >= 6, `Endless long run must repeatedly recover; troughs=${localTroughs.length}.`);
assert.ok(Math.max(...longRun) >= 72, 'Endless waves must reach genuinely hard peaks.');
assert.ok(Math.min(...longRun) <= 32, 'Endless waves must return to noticeably easier recovery levels.');

const firstCycle = longRun.slice(0, 28);
const secondCycle = longRun.slice(28, 56);
assert.notDeepEqual(firstCycle, secondCycle, 'Adjacent Endless waves must not be identical copies.');

const earlyAverage = longRun.slice(0, 56).reduce((sum, value) => sum + value, 0) / 56;
const lateAverage = longRun.slice(-56).reduce((sum, value) => sum + value, 0) / 56;
assert.ok(
  Math.abs(lateAverage - earlyAverage) <= 8,
  `Endless must not trend upward forever; early=${earlyAverage.toFixed(1)} late=${lateAverage.toFixed(1)}.`,
);

for (let ordinal = 1; ordinal <= 400; ordinal += 1) {
  assert.deepEqual(
    getEndlessProgressionTarget(ordinal),
    getEndlessProgressionTarget(ordinal),
    `Endless progression must be deterministic at ordinal ${ordinal}.`,
  );
}

console.info('[Dungeon Logic] Endless progression sanity: gentle opening + deterministic pseudo-random waves passed');

import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const source = readFileSync('src/scenes/GameScene.ts', 'utf8');
const onboardingStart = source.indexOf('const onboardingPanel');
const controlsStart = source.indexOf('const controlsLocked', onboardingStart);
assert(onboardingStart >= 0 && controlsStart > onboardingStart, 'Onboarding panel section must be present.');
const onboardingSource = source.slice(onboardingStart, controlsStart);

assert(onboardingSource.includes('this.add.graphics()'), 'Tutorial panel must use Graphics so its border never scales with setDisplaySize.');
assert(onboardingSource.includes('fillRoundedRect('), 'Tutorial panel must draw a filled rounded rectangle at its real size.');
assert(onboardingSource.includes('strokeRoundedRect('), 'Tutorial panel must draw a fixed-width rounded border at its real size.');
assert(!onboardingSource.includes('setDisplaySize(panelWidth, panelHeight)'), 'Tutorial panel must not resize a stroked Rectangle via display scale.');

console.info('[Dungeon Logic] Tutorial panel graphics sanity: PASS');

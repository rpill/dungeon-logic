import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const source = readFileSync(new URL('../src/scenes/GameScene.ts', import.meta.url), 'utf8');

assert(
  source.includes('const relayoutGameViewport = (): void => {'),
  'GameScene must expose one shared viewport relayout path for resize and resume.',
);
assert(
  /const handleResize = \(\): void => \{\s*if \(!this\.scene\.isActive\(\)\) return;\s*relayoutGameViewport\(\);\s*\};/s.test(source),
  'Live resize must delegate to the shared viewport relayout path.',
);
assert(
  /const handleSceneResume = \(\): void => \{[\s\S]*?relayoutGameViewport\(\);[\s\S]*?if \(onboardingOpen\)/.test(source),
  'Scene resume must relayout the full game viewport before restoring onboarding/input state.',
);
assert(
  /const relayoutGameViewport = \(\): void => \{[\s\S]*?sceneBackground\.sync\(\);[\s\S]*?board\?\.relayout\([\s\S]*?relayoutResetDialog\(\);[\s\S]*?relayoutOnboarding\(\);/.test(source),
  'Shared viewport relayout must refresh background, board, reset dialog, and onboarding geometry.',
);

console.info('[Dungeon Logic] Game resume relayout sanity: resize/resume share a full geometry refresh path');

import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const gameScene = readFileSync(new URL('../src/scenes/GameScene.ts', import.meta.url), 'utf8');
const completionStart = gameScene.indexOf('const showTutorialCompletionState =');
const completionEnd = gameScene.indexOf('const showDailyCompletionState =', completionStart);
assert(completionStart >= 0 && completionEnd > completionStart, 'Tutorial completion block not found.');
const tutorialCompletion = gameScene.slice(completionStart, completionEnd);

assert(
  tutorialCompletion.includes('const nextLevel = result.recommendedNextLevel;'),
  'Tutorial completion must use the progression result to decide whether another lesson exists.',
);
assert(
  tutorialCompletion.includes('service.startLevel(nextLevel.id)'),
  'Tutorial completion action must launch the recommended next lesson.',
);
assert(
  tutorialCompletion.includes(': (() => this.scene.start(HOME_SCENE_KEY))'),
  'Final Tutorial completion must retain its existing Home action.',
);

console.info('[Dungeon Logic] Tutorial completion navigation sanity: next lesson or Home passed');

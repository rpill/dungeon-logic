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
  tutorialCompletion.includes('service.getContinueLevel() ?? service.getLevels()[0]'),
  'Completed Tutorial must continue to the current Campaign level, falling back to campaign-001 only when Campaign has not started.',
);
assert(
  tutorialCompletion.includes('service.startLevel(continueLevel.id)'),
  'Tutorial completion action must launch the resolved Campaign continue level.',
);
assert(
  !tutorialCompletion.includes('service.startLevel(firstLevel.id)'),
  'Tutorial completion must not always restart Campaign from level 1.',
);

console.info('[Dungeon Logic] Tutorial replay campaign return sanity: completion continues current Campaign progress');

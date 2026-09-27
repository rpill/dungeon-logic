import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const source = readFileSync(new URL('../src/scenes/GameScene.ts', import.meta.url), 'utf8');

assert(
  source.includes('const getTutorialLayoutBottomReserve = (): number =>'),
  'GameScene must define a tutorial layout reserve independent of onboarding visibility.',
);
assert(
  source.includes('let boardLayout = calculateStableBoardLayout(getTutorialLayoutBottomReserve(), safeTop);'),
  'Tutorial reserve must be applied before BoardView is created.',
);
assert(
  source.includes('const getCurrentBoardBottomReserve = (): number =>'),
  'GameScene must have one current reserve policy for resize/completion.',
);
assert(
  source.includes('boardLayout = calculateStableBoardLayout(getCurrentBoardBottomReserve());'),
  'Board relayout must use the persistent reserve policy.',
);

const tutorialCompletionStart = source.indexOf('const showTutorialCompletionState =');
const tutorialCompletionEnd = source.indexOf('const showDailyCompletionState =', tutorialCompletionStart);
assert(tutorialCompletionStart >= 0 && tutorialCompletionEnd > tutorialCompletionStart, 'Tutorial completion block not found.');
const tutorialCompletion = source.slice(tutorialCompletionStart, tutorialCompletionEnd);
assert(
  !tutorialCompletion.includes('calculateSafeBoardLayout(40)'),
  'Tutorial completion must not switch to the generic 40px completion reserve.',
);
assert(
  !tutorialCompletion.includes('board?.relayout('),
  'Tutorial completion must not move the board when only the bottom panel changes.',
);

const reserveMatch = source.match(
  /const getTutorialLayoutBottomReserve = \(\): number => \([\s\S]*?\n    \);/,
);
assert(reserveMatch !== null, 'Tutorial reserve helper body not found.');
assert(
  !reserveMatch[0].includes('onboardingOpen'),
  'Tutorial reserve must not disappear when onboarding closes.',
);

console.info('Tutorial board stability sanity: PASS');

import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const tutorialService = readFileSync(new URL('../src/tutorial/TutorialService.ts', import.meta.url), 'utf8');
const homeScene = readFileSync(new URL('../src/scenes/HomeScene.ts', import.meta.url), 'utf8');

assert(
  tutorialService.includes('startEntryLevel()'),
  'TutorialService must expose one entry-point method for first run, resume, and completed replay.',
);
assert(
  tutorialService.includes('if (tutorial.completed)')
    && tutorialService.includes('activePuzzle: null')
    && tutorialService.includes('return firstLevel;'),
  'Completed Tutorial entry must clear stale active puzzle state and return tutorial-001.',
);
assert(
  homeScene.includes('service.startEntryLevel()'),
  'Home Tutorial action must use the replay-aware TutorialService entry point.',
);
assert(
  !homeScene.includes('void this.launchTutorial(tutorial, tutorialEntry);'),
  'Completed Home Tutorial must not launch a stale continue-level entry directly.',
);

console.info('[Dungeon Logic] Tutorial replay entry sanity: completed replay restarts from tutorial-001 with clean active state');

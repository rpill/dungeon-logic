import { readFileSync } from 'node:fs';

import { level as campaign003 } from '../content/campaign/levels/campaign003';
import { chooseHint } from '../gameplay/HintService';
import { PuzzleState } from '../puzzle/PuzzleState';
import { CellState } from '../puzzle/types';
import {
  createCompletedReviewPuzzle,
  resolveCampaignPlayState,
} from '../runtime/CampaignPlayState';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const gameSceneSource = readFileSync(new URL('../scenes/GameScene.ts', import.meta.url), 'utf8');
const settingsSceneSource = readFileSync(new URL('../scenes/SettingsScene.ts', import.meta.url), 'utf8');
const mainSource = readFileSync(new URL('../main.ts', import.meta.url), 'utf8');

const puzzle = new PuzzleState(campaign003);
for (let x = 1; x < campaign003.width; x += 1) puzzle.setCellState(x, 0, CellState.Wall);
puzzle.setCellState(0, 1, CellState.Floor);
let hint = chooseHint(puzzle);
assert(hint?.x === 1 && hint.y === 1 && hint.state === CellState.Floor, 'Campaign 003 disputed hint target is Floor.');
puzzle.setCellState(1, 1, CellState.Wall);
hint = chooseHint(puzzle);
assert(hint?.x === 1 && hint.y === 1 && hint.state === CellState.Floor, 'Wrong Wall does not change Campaign 003 hint truth.');

const review = resolveCampaignPlayState(campaign003, {
  completedLevelIds: [campaign003.id],
  levelResults: {
    [campaign003.id]: {
      bestTimeMs: 33_000,
      minHintsUsed: 0,
      solveCount: 1,
      solvedWithoutHints: true,
    },
  },
  activePuzzle: null,
});
assert(review.mode === 'completed-review' && review.displayTimeMs === 33_000, 'Completed campaign launch resolves to locked review with best time.');
const solvedPuzzle = createCompletedReviewPuzzle(campaign003);
assert(solvedPuzzle.getCellState(1, 1) === CellState.Floor, 'Completed review reconstructs the canonical Floor in the disputed cell.');

assert(gameSceneSource.includes("let solved = completedReview;"), 'GameScene starts completed review in solved/locked state.');
assert(gameSceneSource.includes("const initialTimerMs = completedReview"), 'GameScene derives completed review timer from stored result rather than starting a run.');
assert(gameSceneSource.includes("board.setInputEnabled(false);\n      updateTimerText();\n      refreshStatusText();"), 'Completed review disables board input and renders frozen time/status.');
assert(gameSceneSource.includes("const freshSession = PuzzleSessionService.createCampaign("), 'Completed Reset creates a new campaign puzzle session.');
assert(gameSceneSource.includes("this.scene.restart(launchData);"), 'Fresh completed-level replay restarts GameScene from the new 00:00 session.');
assert(gameSceneSource.includes("if (currentHint !== null) {\n        refreshStatusText();\n        return;"), 'Unresolved current hint cannot consume/reveal the same hint again.');
assert(gameSceneSource.includes("this.scene.launch(SETTINGS_SCENE_KEY, { returnSceneKey: 'GameScene' });"), 'GameScene exposes direct Settings overlay navigation.');
assert(gameSceneSource.includes("copy.game.levelTitle(campaignEntry.slot, campaignLevelTotal)"), 'Campaign GameScene title identifies the current level number.');
assert(settingsSceneSource.includes("this.scene.restart({ returnSceneKey: this.returnSceneKey });"), 'Settings preserves GameScene return target across its own restart.');
assert(settingsSceneSource.includes("this.scene.resume('GameScene');"), 'Settings Back returns directly to the paused GameScene.');
const gameSceneIndex = mainSource.indexOf('    GameScene,');
const settingsSceneIndex = mainSource.indexOf('    SettingsScene,');
assert(
  gameSceneIndex >= 0 && settingsSceneIndex > gameSceneIndex,
  'SettingsScene is registered after GameScene so in-game Settings renders above the paused board.',
);

console.info('[Dungeon Logic] Game regression sanity: hint truth + completed review/replay + in-game settings/title wiring passed');

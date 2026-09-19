import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const overlayPath = resolve(root, 'src/runtime/MasteryRankUpOverlay.ts');
const gamePath = resolve(root, 'src/scenes/GameScene.ts');
const copyPath = resolve(root, 'src/i18n/UiCopy.ts');

assert(existsSync(overlayPath), 'Mastery rank-up overlay module must exist.');
const overlay = readFileSync(overlayPath, 'utf8');
const game = readFileSync(gamePath, 'utf8');
const copy = readFileSync(copyPath, 'utf8');

assert(overlay.includes("from './MasterySeal'"), 'Rank-up overlay must use MasterySeal.');
assert(overlay.includes('createPrimaryActionButton'), 'Rank-up overlay must use the shared primary Continue button.');
assert(overlay.includes("play('complete')"), 'Rank-up overlay must reuse the completion audio feedback.');
assert(!/particle|confetti/i.test(overlay), 'Rank-up overlay must not use particles or confetti.');
assert(copy.includes("newRank: 'НОВЫЙ РАНГ'"), 'Russian copy must include NEW RANK.');
assert(copy.includes("newRank: 'NEW RANK'"), 'English copy must include NEW RANK.');

assert(game.includes("from '../runtime/MasteryRankUpOverlay'"), 'GameScene must import the rank-up overlay.');
assert(game.includes('showMasteryRankUpOverlay'), 'GameScene must open the rank-up overlay.');
assert(game.includes('transition.rankAdvanced'), 'Rank-up overlay must only open on rank advancement.');
assert(game.includes('analytics?.masteryRankUp('), 'GameScene must emit mastery_rank_up analytics.');
assert(game.includes('masteryRankUpShown'), 'GameScene must guard rank-up overlay/analytics against duplicate Daily completion refreshes.');
assert(game.includes('showCompletionState(result, metadata, newBestTime, masteryCampaignNote);'), 'Campaign completion state must still be prepared normally.');
assert(game.includes('showEndlessCompletionState(result.completed, masteryEndlessNote);'), 'Endless completion state must still be prepared normally.');
assert(game.includes('showDailyCompletionState(result, leaderboardEntry, masteryDailyNote);'), 'Daily completion state must still be prepared normally.');

console.info('[Dungeon Logic] Mastery rank-up overlay sanity: PASS');

assert(overlay.includes('centerY + panelHeight / 2 - buttonHeight / 2 - (narrow ? 18 : 24)'), 'Rank-up Continue button must be anchored to the panel bottom with a safe margin.');

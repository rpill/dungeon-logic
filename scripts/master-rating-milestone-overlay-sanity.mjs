import fs from 'node:fs';

const rating = fs.readFileSync(new URL('../src/mastery/MasterRating.ts', import.meta.url), 'utf8');
const game = fs.readFileSync(new URL('../src/scenes/GameScene.ts', import.meta.url), 'utf8');
const overlay = fs.readFileSync(new URL('../src/runtime/MasteryRankUpOverlay.ts', import.meta.url), 'utf8');

function assert(condition, message) { if (!condition) throw new Error(message); }
assert(rating.includes('MASTER_RATING_MILESTONE_STEP = 100'), 'Master Rating milestone step must be 100.');
assert(game.includes('getMasterRatingMilestone('), 'GameScene must detect Master Rating hundred crossings.');
assert(game.includes("getMasterySnapshot(beforeProfile).currentRank !== 'MASTER'"), 'Rating milestone must be gated to players already at MASTER.');
assert(game.includes('masterRatingMilestone: {'), 'GameScene must pass rating milestone content to the rank-up overlay.');
assert(overlay.includes('options.masterRatingMilestone.rating'), 'Rank-up overlay must render the numeric Master Rating for milestone celebrations.');
console.info('[Dungeon Logic] Master Rating milestone overlay sanity: PASS');

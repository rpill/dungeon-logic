const { DifficultyBand } = await import(new URL('../puzzle/difficulty/types.ts', import.meta.url).href) as typeof import('../puzzle/difficulty/types');
const { createFreshPlayerProfile, normalizePlayerProfile } = await import(new URL('../profile/PlayerProfile.ts', import.meta.url).href) as typeof import('../profile/PlayerProfile');
const rating = await import(new URL('../mastery/MasterRating.ts', import.meta.url).href) as typeof import('../mastery/MasterRating');

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const fresh = createFreshPlayerProfile();
assert(fresh.mastery.rating === 1000, 'Fresh profile must start Master Rating at 1000.');
assert(rating.MASTER_RATING_BASE === 1000, 'Master Rating base must be 1000.');
assert(rating.DAILY_MASTER_RATING_REWARD === 3, 'First Daily reward must be +3.');
assert(rating.getEndlessMasterRatingReward(DifficultyBand.Easy) === 2, 'Easy Endless reward must be +2.');
assert(rating.getEndlessMasterRatingReward(DifficultyBand.Medium) === 3, 'Medium Endless reward must be +3.');
assert(rating.getEndlessMasterRatingReward(DifficultyBand.Hard) === 5, 'Hard Endless reward must be +5.');
assert(rating.getEndlessMasterRatingReward(DifficultyBand.Expert) === 8, 'Expert Endless reward must be +8.');
assert(rating.formatMasterRating(12_345, 'ru') === '12 345', 'Russian rating formatting must use grouped digits.');
assert(rating.formatMasterRating(12_345, 'en') === '12,345', 'English rating formatting must use grouped digits.');
assert(rating.getMasterRatingMilestone(1098, 1101) === 1100, 'Crossing 1100 must trigger the 1100 milestone.');
assert(rating.getMasterRatingMilestone(1101, 1199) === null, 'Progress inside the same hundred must not trigger a milestone.');
assert(rating.getMasterRatingMilestone(1199, 1202) === 1200, 'Crossing 1200 must trigger the 1200 milestone.');

const partial = normalizePlayerProfile({
  ...fresh,
  mastery: undefined,
  endless: {
    activePuzzle: null,
    completed: 7,
    currentStreak: 2,
    bestStreak: 4,
  },
}, [], 'ru');
assert(partial.mastery.rating === 1000, 'Same-schema profile missing mastery state must normalize to base rating.');
assert(partial.endless.completed === 7, 'Same-schema profile normalization must preserve Endless completion count.');
assert(partial.endless.nextFreshIndex === 7, 'Same-schema Endless state missing the new cursor must normalize nextFreshIndex from completed.');
assert(partial.endless.skipped.length === 0, 'Missing skip queue must normalize empty.');
assert(partial.endless.activeCatalogIndex === null && partial.endless.activeKind === null, 'Missing active Endless selection must normalize empty.');
assert(partial.endless.freePlayOrdinal === 0, 'Missing Free Play ordinal must normalize to zero.');

console.info('[Dungeon Logic] Master Rating sanity: rewards + formatting + profile defaults passed');

const { deriveMastery } = await import(new URL('../mastery/MasteryProgress.ts', import.meta.url).href) as typeof import('../mastery/MasteryProgress');

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const fresh = deriveMastery({ campaignCompleted: 0, dailyCompleted: 0, endlessCompleted: 0 });
assert(fresh.currentRank === 'I', 'Fresh profile must start at rank I.');
assert(fresh.nextRank === 'II', 'Rank I must progress toward II.');

const noSkip = deriveMastery({ campaignCompleted: 4, dailyCompleted: 20, endlessCompleted: 500 });
assert(noSkip.currentRank === 'I', 'Later-mode volume must not skip the campaign-gated first promotion.');

const rankTwo = deriveMastery({ campaignCompleted: 5, dailyCompleted: 0, endlessCompleted: 0 });
assert(rankTwo.currentRank === 'II', '5 campaign levels must reach rank II.');

const rankThree = deriveMastery({ campaignCompleted: 10, dailyCompleted: 1, endlessCompleted: 5 });
assert(rankThree.currentRank === 'III', '10 campaign + 1 Daily + 5 Endless must reach rank III.');

const rankFive = deriveMastery({ campaignCompleted: 26, dailyCompleted: 5, endlessCompleted: 35 });
assert(rankFive.currentRank === 'V', '26 / 5 / 35 must reach rank V.');

const rankEight = deriveMastery({ campaignCompleted: 56, dailyCompleted: 15, endlessCompleted: 300 });
assert(rankEight.currentRank === 'VIII', '56 / 15 / 300 must reach rank VIII.');

const master = deriveMastery({ campaignCompleted: 64, dailyCompleted: 20, endlessCompleted: 500 });
assert(master.currentRank === 'MASTER', '64 campaign + 20 Daily + 500 Endless must reach MASTER.');
assert(master.nextRank === null, 'MASTER must have no next rank.');

const streaksMustNotMatter = deriveMastery({ campaignCompleted: 10, dailyCompleted: 1, endlessCompleted: 5 });
assert(streaksMustNotMatter.currentRank === 'III', 'Mastery must depend only on irreversible completion totals.');

console.info('[Dungeon Logic] Mastery progress sanity: PASS');

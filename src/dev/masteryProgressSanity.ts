const { deriveMastery } = await import(new URL('../mastery/MasteryProgress.ts', import.meta.url).href) as typeof import('../mastery/MasteryProgress');

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const fresh = deriveMastery({ campaignCompleted: 0, dailyBestStreak: 0, endlessBestCleanStreak: 0 });
assert(fresh.currentRank === 'I', 'Fresh profile must start at rank I.');
assert(fresh.nextRank === 'II', 'Rank I must progress toward II.');

const noSkip = deriveMastery({ campaignCompleted: 7, dailyBestStreak: 30, endlessBestCleanStreak: 50 });
assert(noSkip.currentRank === 'I', 'Later-mode records must not skip campaign-gated early ranks.');

const rankThree = deriveMastery({ campaignCompleted: 24, dailyBestStreak: 0, endlessBestCleanStreak: 3 });
assert(rankThree.currentRank === 'III', '24 campaign + Endless clean 3 must reach III.');

const rankFive = deriveMastery({ campaignCompleted: 64, dailyBestStreak: 5, endlessBestCleanStreak: 10 });
assert(rankFive.currentRank === 'V', '64 / Daily 5 / Endless 10 must reach V.');

const master = deriveMastery({ campaignCompleted: 64, dailyBestStreak: 30, endlessBestCleanStreak: 50 });
assert(master.currentRank === 'MASTER', 'Daily 30 + Endless 50 must reach MASTER after campaign is complete.');
assert(master.nextRank === null, 'MASTER must have no next rank.');

console.info('[Dungeon Logic] Mastery progress sanity: PASS');

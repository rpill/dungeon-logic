import { campaignCurationPlan } from '../content/campaign/curationPlan';
import {
  evaluateDailyReleaseEligibility,
  V1_RELEASE_ARCHETYPES,
} from '../content/release/DailyReleasePolicy';
import {
  analyzeReleaseCandidates,
  rankCampaignSlotCandidates,
  selectDailyReleaseShortlist,
  type ReleaseCandidateAnalysis,
} from '../content/release/ReleaseCuration';
import { generateCandidate } from '../puzzle/generator/CandidateGenerator';
import {
  GeneratorArchetype,
  type GeneratedCandidate,
} from '../puzzle/generator/types';

function assertTrue(value: unknown, message = 'assertion failed'): asserts value {
  if (!value) throw new Error(message);
}

function assertEqual(actual: unknown, expected: unknown, message?: string): void {
  if (actual !== expected) {
    throw new Error(message ?? `Expected ${String(expected)}, got ${String(actual)}.`);
  }
}

function assertDeepEqual(actual: unknown, expected: unknown, message?: string): void {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) throw new Error(message ?? `Expected ${right}, got ${left}.`);
}

function candidateIds(entries: readonly ReleaseCandidateAnalysis[]): readonly string[] {
  return entries.map((entry) => entry.candidate.id);
}

function cloneCandidate(
  base: GeneratedCandidate,
  id: string,
  seed: number,
): GeneratedCandidate {
  return {
    ...base,
    id,
    seed,
    level: {
      ...base.level,
      id,
    },
  };
}

function cloneAnalysis(
  base: ReleaseCandidateAnalysis,
  index: number,
): ReleaseCandidateAnalysis {
  const id = `bulk-release-${String(index).padStart(3, '0')}`;
  const candidate = cloneCandidate(base.candidate, id, 1_000_000 + index);
  return {
    ...base,
    candidate,
    accepted: {
      ...base.accepted,
      candidate,
    },
  };
}

const releaseArchetypes = new Set(V1_RELEASE_ARCHETYPES);
assertEqual(campaignCurationPlan.length, 64);

for (const rule of campaignCurationPlan) {
  assertTrue(
    rule.allowedArchetypes.every((value) => releaseArchetypes.has(value as typeof V1_RELEASE_ARCHETYPES[number])),
    `slot ${rule.slot} contains a non-v1 archetype`,
  );
}

assertDeepEqual(
  candidateIds([]),
  [],
);

const dailyBase = {
  archetype: GeneratorArchetype.MonsterOnly,
  size: 7 as const,
  difficultyBand: 'medium' as const,
  difficultyScore: 30,
  humanStatus: 'solved-with-contradiction' as const,
  blockerCount: 0,
  doorCount: 0,
};

assertDeepEqual(
  evaluateDailyReleaseEligibility(dailyBase),
  { eligible: true, reasons: [] },
);
assertEqual(evaluateDailyReleaseEligibility({ ...dailyBase, difficultyBand: 'easy', difficultyScore: 24 }).eligible, false);
assertEqual(evaluateDailyReleaseEligibility({ ...dailyBase, archetype: GeneratorArchetype.ChestTwoRooms }).eligible, false);
assertEqual(evaluateDailyReleaseEligibility({ ...dailyBase, difficultyBand: 'hard', difficultyScore: 69 }).eligible, false);
assertEqual(evaluateDailyReleaseEligibility({ ...dailyBase, difficultyScore: 29 }).eligible, false);
assertEqual(evaluateDailyReleaseEligibility({ ...dailyBase, size: 6 }).eligible, false);
assertEqual(evaluateDailyReleaseEligibility({ ...dailyBase, difficultyBand: 'expert', difficultyScore: 75 }).eligible, false);
assertEqual(evaluateDailyReleaseEligibility({ ...dailyBase, humanStatus: 'stuck' }).eligible, false);
assertEqual(evaluateDailyReleaseEligibility({ ...dailyBase, blockerCount: 1 }).eligible, false);
assertEqual(evaluateDailyReleaseEligibility({ ...dailyBase, doorCount: 1 }).eligible, false);
assertEqual(evaluateDailyReleaseEligibility({ ...dailyBase, difficultyBand: 'hard', difficultyScore: 68 }).eligible, true);

const generated = generateCandidate({
  archetype: GeneratorArchetype.MonsterOnly,
  size: 7,
  seed: 2_111_257_597,
});
assertTrue(generated.ok, generated.ok ? undefined : generated.reason);

const validA = cloneCandidate(generated.candidate, 'release-valid-a', 2_111_257_597);
const validB = cloneCandidate(generated.candidate, 'release-valid-b', 2_111_257_598);
const invalid = cloneCandidate(generated.candidate, 'release-invalid', 2_111_257_599);
invalid.level.rowClues = [99, ...invalid.level.rowClues.slice(1)];
const twoRoomMetadata = {
  ...cloneCandidate(generated.candidate, 'release-two-room', 2_111_257_600),
  archetype: GeneratorArchetype.ChestTwoRooms,
} satisfies GeneratedCandidate;

const duplicateA = cloneCandidate(generated.candidate, 'release-valid-a', 2_111_257_611);
const forward = analyzeReleaseCandidates([validB, duplicateA, invalid, twoRoomMetadata, validA]);
const reverse = analyzeReleaseCandidates([validA, twoRoomMetadata, invalid, duplicateA, validB]);

assertDeepEqual(candidateIds(forward.accepted), ['release-valid-a', 'release-valid-b']);
assertDeepEqual(candidateIds(reverse.accepted), ['release-valid-a', 'release-valid-b']);
assertDeepEqual(
  forward.rejected.map((entry) => [entry.candidateId, entry.reason]),
  reverse.rejected.map((entry) => [entry.candidateId, entry.reason]),
  'release analysis must be input-order independent',
);
assertTrue(forward.rejected.some((entry) => entry.candidateId === 'release-valid-a' && entry.reason === 'duplicate-candidate-id'));
assertTrue(forward.rejected.some((entry) => entry.candidateId === 'release-invalid' && entry.reason.startsWith('canonical-')));
assertTrue(forward.rejected.some((entry) => entry.candidateId === 'release-two-room' && entry.reason === 'archetype-not-in-v1'));

const analyzedBase = forward.accepted[0];
assertTrue(analyzedBase !== undefined);
assertEqual(analyzedBase.accepted.difficulty.band, 'medium');
assertEqual(analyzedBase.accepted.difficulty.score, 43);
assertEqual(analyzedBase.dailyEligibility.eligible, true);

const bulk = Array.from({ length: 250 }, (_, index) => cloneAnalysis(analyzedBase, index));
const bulkReverse = [...bulk].reverse();

const dailyForward = selectDailyReleaseShortlist(bulk, 60);
const dailyReverse = selectDailyReleaseShortlist(bulkReverse, 60);
assertEqual(dailyForward.eligibleCount, 250);
assertEqual(dailyForward.selected.length, 60);
assertEqual(dailyForward.reservoir.length, 190);
assertDeepEqual(candidateIds(dailyForward.selected), candidateIds(dailyReverse.selected));
assertDeepEqual(candidateIds(dailyForward.reservoir), candidateIds(dailyReverse.reservoir));

const campaignForward = rankCampaignSlotCandidates(bulk, 23, 12);
const campaignReverse = rankCampaignSlotCandidates(bulkReverse, 23, 12);
assertEqual(campaignForward.length, 12);
assertDeepEqual(candidateIds(campaignForward), candidateIds(campaignReverse));
assertEqual(rankCampaignSlotCandidates(bulk, 23, 0).length, 0);

let invalidLimitRejected = false;
try {
  selectDailyReleaseShortlist(bulk, -1);
} catch (error) {
  invalidLimitRejected = error instanceof RangeError;
}
assertTrue(invalidLimitRejected, 'negative shortlist limits must be rejected');

console.log('[Dungeon Logic] Release curation sanity: final v1 contract + deterministic 250-candidate reservoir tooling passed');

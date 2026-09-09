import {
  DAILY_RELEASE_ARCHETYPE_COUNTS,
  DAILY_RELEASE_COUNT,
  DAILY_RELEASE_MASTER_SEED,
  DAILY_RELEASE_MIN_NEIGHBOR_DISTANCE,
  DAILY_RELEASE_SCAN_PLAN,
  DAILY_RELEASE_SLOT_SPECS,
  selectDailyReleaseCorpus,
  type DailyReleaseCandidateAnalysis,
} from '../content/release/DailyReleaseCorpus';
import { generateDailyReleaseReservoir } from '../content/release/DailyReleaseReservoir';
import { GeneratorArchetype, type AcceptedCandidate } from '../puzzle/generator/types';
import type { DifficultyBand } from '../puzzle/difficulty/types';
import { campaignReleaseStructuralFingerprint } from '../content/release/CampaignReleaseSelection';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function fakeAccepted(
  id: string,
  archetype: 'monster-only' | 'mixed-one-room' | 'chest-one-room',
  band: Exclude<DifficultyBand, 'unrated'>,
  score: number,
  offset: number,
): AcceptedCandidate {
  const solution = Array.from({ length: 7 }, (_, y) =>
    Array.from({ length: 7 }, (_, x) => {
      const hash = (Math.imul(x + 3, 73856093) ^ Math.imul(y + 5, 19349663) ^ Math.imul(offset + 11, 83492791)) >>> 0;
      return hash % 5 === 0 ? '#' : '.';
    }).join(''),
  );
  return {
    candidate: {
      id,
      seed: offset + 100,
      archetype,
      size: 7,
      rooms: [],
      level: {
        id,
        width: 7,
        height: 7,
        rowClues: [1, 1, 1, 1, 1, 1, 1],
        columnClues: [1, 1, 1, 1, 1, 1, 1],
        monsters: archetype === GeneratorArchetype.MonsterOnly ? [{ x: 0, y: 0 }] : [],
        chests: archetype === GeneratorArchetype.MonsterOnly ? [] : [{ x: 3, y: 3 }],
        blockers: [],
        doors: [],
        solution,
      },
    },
    quality: {
      passes: true,
      issues: [],
      warnings: [],
      metrics: {
        wallDensity: 0.25,
        fullWallLineCount: 0,
        nearFullWallLineCount: 0,
        solidWall3x3Count: 0,
        thickWallCellCount: 1,
        thickWallCellRatio: 0.1,
        wallOpenBoundaryEdgeCount: 20,
        wallOpenBoundaryPerWall: 2,
        largestWallComponentSize: 4,
        largestWallComponentRatio: 0.2,
        largestWallComponentPerimeterPerWall: 2,
        clueOnlyForcedWallCount: 0,
        clueOnlyForcedWallRatio: 0,
        objectAwareForcedWallCount: 1,
        objectAssistedForcedWallCount: 1,
        basicPropagationResolvedWallCount: 1,
        basicPropagationResolvedNonWallCount: 1,
        basicPropagationResolvedCount: 2,
        basicPropagationResolvedRatio: 2 / 49,
      },
    },
    solutionCount: 1,
    difficulty: {
      version: 1,
      score,
      band,
      reasoningTier: band === 'medium' ? 'contradiction-light' : 'contradiction-heavy',
      components: { boardLoad: 0.46, directLoad: 0.3, advancedRuleLoad: 0.2, lookaheadLoad: 0.2 },
      ordinaryContradictions: band === 'medium' ? 1 : 3,
      treasureRoomVariantSteps: 0,
      treasureRoomStructuralConsensusSteps: 0,
      treasureRoomHypothesisConsequenceSteps: 0,
      reasons: [],
    },
  };
}

assert(DAILY_RELEASE_MASTER_SEED === 20260909, 'Daily corpus master seed must stay stable.');
assert(DAILY_RELEASE_COUNT === 365, 'Daily release corpus must contain 365 snapshots.');
assert(DAILY_RELEASE_SCAN_PLAN.length === 3, 'Daily release scan must stay V1-only.');
assert(DAILY_RELEASE_SCAN_PLAN.every((entry) => entry.size === 7), 'Daily v1 corpus should use the proven 7x7 release scan.');
assert(DAILY_RELEASE_SLOT_SPECS.length === DAILY_RELEASE_COUNT, 'Every Daily snapshot needs a selection spec.');
assert(DAILY_RELEASE_ARCHETYPE_COUNTS[GeneratorArchetype.MonsterOnly] === 217, 'Daily corpus needs 217 monster-only snapshots.');
assert(DAILY_RELEASE_ARCHETYPE_COUNTS[GeneratorArchetype.MixedOneRoom] === 126, 'Daily corpus needs 126 mixed snapshots.');
assert(DAILY_RELEASE_ARCHETYPE_COUNTS[GeneratorArchetype.ChestOneRoom] === 22, 'Daily corpus needs 22 chest snapshots.');
assert(DAILY_RELEASE_MIN_NEIGHBOR_DISTANCE > 0, 'Daily sequence diversity gate must be active.');

const tinyPlan = [
  { archetype: GeneratorArchetype.MonsterOnly, size: 7 as const, attempts: 40 },
  { archetype: GeneratorArchetype.MixedOneRoom, size: 7 as const, attempts: 80 },
] as const;
const tinyA = generateDailyReleaseReservoir(tinyPlan, 424243);
const tinyB = generateDailyReleaseReservoir(tinyPlan, 424243);
assert(tinyA.accepted.length > 0, 'Tiny Daily release scan should find accepted candidates.');
assert(tinyA.accepted.map((entry) => entry.candidate.id).join('|') === tinyB.accepted.map((entry) => entry.candidate.id).join('|'), 'Daily reservoir generation must be deterministic.');

const synthetic: AcceptedCandidate[] = [];
for (let index = 0; index < 12; index += 1) {
  synthetic.push(fakeAccepted(`m-${index}`, GeneratorArchetype.MonsterOnly, index % 2 === 0 ? 'medium' : 'hard', 32 + (index % 6) * 6, 100 + index));
  synthetic.push(fakeAccepted(`x-${index}`, GeneratorArchetype.MixedOneRoom, index % 2 === 0 ? 'medium' : 'hard', 34 + (index % 6) * 6, 200 + index));
  synthetic.push(fakeAccepted(`c-${index}`, GeneratorArchetype.ChestOneRoom, index < 2 ? 'medium' : 'hard', 44 + Math.min(index, 5) * 4, 300 + index));
}
const syntheticAnalyzed: DailyReleaseCandidateAnalysis[] = synthetic.map((accepted) => ({
  accepted,
  humanStatus: 'solved-direct',
  qualityScore: 10,
  structuralFingerprint: campaignReleaseStructuralFingerprint(accepted.candidate.level.solution),
}));
const selectedForward = selectDailyReleaseCorpus(syntheticAnalyzed, 15);
const selectedReverse = selectDailyReleaseCorpus([...syntheticAnalyzed].reverse(), 15);
assert(selectedForward.length === 15, 'Daily selector should fill requested prefix when eligible candidates exist.');
assert(selectedForward.map((entry) => entry.candidate.accepted.candidate.id).join('|') === selectedReverse.map((entry) => entry.candidate.accepted.candidate.id).join('|'), 'Daily selection must not depend on input order.');
assert(new Set(selectedForward.map((entry) => entry.candidate.accepted.candidate.id)).size === selectedForward.length, 'Daily candidate cannot be reused.');
assert(new Set(selectedForward.map((entry) => entry.candidate.structuralFingerprint)).size === selectedForward.length, 'Daily wall geometry must be globally unique.');

console.info('[Dungeon Logic] Daily corpus sanity: independent reservoir + deterministic balanced selector passed');

import { curatedDailySnapshots } from '../content/daily/snapshots';
import { promotedCampaignLevels } from '../content/campaign/levels';
import { evaluateCandidate } from '../puzzle/generator/CandidateFactory';
import { candidateDistance } from '../puzzle/generator/CandidateRanker';
import { analyzeHumanSolvability } from '../puzzle/human-solver/HumanSolver';

assert(curatedDailySnapshots.length === DAILY_RELEASE_COUNT, 'Curated Daily catalog must contain exactly 365 snapshots.');
const campaignFingerprints = new Set(promotedCampaignLevels.map((entry) => campaignReleaseStructuralFingerprint(entry.level.solution)));
const dailyFingerprints = new Set<string>();
const dailyCandidateIds = new Set<string>();
const curatedCounts: Record<string, number> = {};
let mediumCount = 0;
let hardCount = 0;
let previousAccepted: AcceptedCandidate | null = null;
for (let index = 0; index < curatedDailySnapshots.length; index += 1) {
  const snapshot = curatedDailySnapshots[index];
  const ordinal = index + 1;
  const expectedId = `daily-${String(ordinal).padStart(3, '0')}`;
  assert(snapshot.ordinal === ordinal, `Daily snapshot ordinal drifted at ${ordinal}.`);
  assert(snapshot.id === expectedId, `Daily snapshot id drifted at ${ordinal}.`);
  assert(snapshot.level.id === expectedId, `Daily level id drifted at ${ordinal}.`);
  assert(snapshot.level.width === 7 && snapshot.level.height === 7, `Daily ${expectedId} must be 7x7.`);
  assert(snapshot.level.blockers.length === 0 && snapshot.level.doors.length === 0, `Daily ${expectedId} uses a forbidden release mechanic.`);
  assert(snapshot.provenance.sourceSeed === DAILY_RELEASE_MASTER_SEED, `Daily ${expectedId} source seed drifted.`);
  assert(!dailyCandidateIds.has(snapshot.provenance.sourceCandidateId), `Daily source candidate reused: ${snapshot.provenance.sourceCandidateId}.`);
  dailyCandidateIds.add(snapshot.provenance.sourceCandidateId);
  curatedCounts[snapshot.provenance.sourceArchetype] = (curatedCounts[snapshot.provenance.sourceArchetype] ?? 0) + 1;
  assert(snapshot.provenance.difficulty === 'medium' || snapshot.provenance.difficulty === 'hard', `Daily ${expectedId} difficulty band is outside release policy.`);
  assert(snapshot.provenance.difficultyScore >= 30 && snapshot.provenance.difficultyScore <= 68, `Daily ${expectedId} difficulty score is outside 30-68.`);
  assert(Math.abs(snapshot.provenance.difficultyScore - snapshot.provenance.targetScore) <= 7, `Daily ${expectedId} is too far from its selection target.`);
  if (snapshot.provenance.difficulty === 'medium') mediumCount += 1;
  else hardCount += 1;

  const fingerprint = campaignReleaseStructuralFingerprint(snapshot.level.solution);
  assert(!campaignFingerprints.has(fingerprint), `Daily ${expectedId} repeats campaign wall geometry.`);
  assert(!dailyFingerprints.has(fingerprint), `Daily ${expectedId} repeats another Daily wall geometry.`);
  dailyFingerprints.add(fingerprint);

  const evaluation = evaluateCandidate({
    id: snapshot.provenance.sourceCandidateId,
    seed: snapshot.provenance.sourceCandidateSeed,
    archetype: snapshot.provenance.sourceArchetype,
    size: 7,
    rooms: [],
    level: snapshot.level,
  });
  assert(evaluation.status === 'accepted', `Daily ${expectedId} failed canonical revalidation: ${evaluation.status}.`);
  assert(evaluation.accepted.difficulty.band === snapshot.provenance.difficulty, `Daily ${expectedId} difficulty band provenance drifted.`);
  assert(evaluation.accepted.difficulty.score === snapshot.provenance.difficultyScore, `Daily ${expectedId} difficulty score provenance drifted.`);
  if (previousAccepted !== null) {
    assert(candidateDistance(evaluation.accepted, previousAccepted) >= DAILY_RELEASE_MIN_NEIGHBOR_DISTANCE, `Daily ${expectedId} falls below the adjacent diversity gate.`);
  }
  previousAccepted = evaluation.accepted;
  const human = analyzeHumanSolvability(snapshot.level);
  assert(human.status === snapshot.provenance.humanStatus, `Daily ${expectedId} Human Solver provenance drifted.`);
}
assert(curatedCounts[GeneratorArchetype.MonsterOnly] === 217, 'Curated Daily monster quota drifted.');
assert(curatedCounts[GeneratorArchetype.MixedOneRoom] === 126, 'Curated Daily mixed quota drifted.');
assert(curatedCounts[GeneratorArchetype.ChestOneRoom] === 22, 'Curated Daily chest quota drifted.');
assert(mediumCount > 0 && hardCount > 0 && mediumCount + hardCount === DAILY_RELEASE_COUNT, 'Every curated Daily must stay medium or hard.');

console.info('[Dungeon Logic] Daily corpus sanity: 365 curated snapshots validated + campaign exclusion passed');

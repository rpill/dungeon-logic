import {
  CAMPAIGN_RELEASE_MASTER_SEED,
  CAMPAIGN_RELEASE_MIN_NEIGHBOR_DISTANCE,
  CAMPAIGN_RELEASE_SCAN_PLAN,
  CAMPAIGN_RELEASE_TARGET_SCORES,
  selectCampaignReleaseSlots,
  campaignReleaseStructuralFingerprint,
} from '../content/release/CampaignReleaseSelection';
import { GeneratorArchetype, type AcceptedCandidate, type GeneratorArchetype as GeneratorArchetypeValue } from '../puzzle/generator/types';
import { getGeneratorMonsterPolicy } from '../puzzle/generator/CandidateFactory';
import { generateCampaignReleaseReservoir } from '../content/release/CampaignReleaseReservoir';
import type { DifficultyBand } from '../puzzle/difficulty/types';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function fakeAccepted(
  id: string,
  archetype: GeneratorArchetypeValue,
  band: Exclude<DifficultyBand, 'unrated'>,
  difficultyScore: number,
  wallOffset: number,
): AcceptedCandidate {
  const solution = Array.from({ length: 7 }, (_, y) =>
    Array.from({ length: 7 }, (_, x) => {
      const hash = (Math.imul(x + 1, 73856093) ^ Math.imul(y + 1, 19349663) ^ Math.imul(wallOffset + 1, 83492791)) >>> 0;
      return hash % 5 === 0 ? '#' : '.';
    }).join(''),
  );
  return {
    candidate: {
      id,
      seed: wallOffset + 1,
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
        wallDensity: 0.25 + wallOffset * 0.001,
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
      score: difficultyScore,
      band,
      reasoningTier: band === 'easy' ? 'direct' : band === 'medium' ? 'contradiction-light' : 'contradiction-heavy',
      components: { boardLoad: 0.46, directLoad: 0.3, advancedRuleLoad: 0.2, lookaheadLoad: 0.2 },
      ordinaryContradictions: band === 'easy' ? 0 : band === 'medium' ? 1 : 3,
      treasureRoomVariantSteps: 0,
      treasureRoomStructuralConsensusSteps: 0,
      treasureRoomHypothesisConsequenceSteps: 0,
      reasons: [],
    },
  };
}

assert(CAMPAIGN_RELEASE_MASTER_SEED === 20260908, 'Release corpus master seed must be stable.');
assert(CAMPAIGN_RELEASE_MIN_NEIGHBOR_DISTANCE === 0.28, 'Neighbor diversity gate drifted.');
assert(CAMPAIGN_RELEASE_SCAN_PLAN.length === 3, 'Release scan must stay V1-only and compact.');
assert(CAMPAIGN_RELEASE_SCAN_PLAN.every((entry) => entry.size === 7), 'Campaign v1 release corpus should use 7x7 scans.');
assert(Object.keys(CAMPAIGN_RELEASE_TARGET_SCORES).length === 25, 'Slots 006-030 need target scores.');
for (let slot = 6; slot <= 30; slot += 1) {
  assert(CAMPAIGN_RELEASE_TARGET_SCORES[slot] !== undefined, `Missing target score for slot ${slot}.`);
}

const fixture = [
  fakeAccepted('mixed-easy-off', GeneratorArchetype.MixedOneRoom, 'easy', 9, 1),
  fakeAccepted('mixed-easy-target', GeneratorArchetype.MixedOneRoom, 'easy', 14, 2),
  fakeAccepted('monster-easy-off', GeneratorArchetype.MonsterOnly, 'easy', 10, 3),
  fakeAccepted('monster-easy-target', GeneratorArchetype.MonsterOnly, 'easy', 15, 4),
  fakeAccepted('monster-medium-30', GeneratorArchetype.MonsterOnly, 'medium', 30, 5),
  fakeAccepted('monster-medium-31', GeneratorArchetype.MonsterOnly, 'medium', 31, 6),
  fakeAccepted('mixed-medium-30', GeneratorArchetype.MixedOneRoom, 'medium', 30, 7),
];

const forward = selectCampaignReleaseSlots(fixture, [6, 7, 8, 9, 10]);
const reverse = selectCampaignReleaseSlots([...fixture].reverse(), [6, 7, 8, 9, 10]);
assert(forward.map((entry) => entry.candidate.candidate.id).join('|') === reverse.map((entry) => entry.candidate.candidate.id).join('|'), 'Selection must not depend on reservoir input order.');
assert(new Set(forward.map((entry) => entry.candidate.candidate.id)).size === forward.length, 'A release candidate must not be reused across campaign slots.');
assert(forward[0].candidate.difficulty.score === 14, 'Slot 006 should prefer its target score when quality is equivalent.');
assert(forward[1].candidate.difficulty.score === 15, 'Slot 007 should prefer its target score when quality is equivalent.');
assert(forward[2].candidate.difficulty.score === 30, 'Slot 008 should prefer its target score.');
assert(forward[3].candidate.difficulty.score === 31, 'Slot 009 should prefer its target score.');
assert(forward[4].candidate.difficulty.score === 30, 'Slot 010 should prefer its target score.');

console.info('[Dungeon Logic] Campaign release sanity: curation corpus + deterministic sequence selection passed');

const tinyPlan = [
  { archetype: GeneratorArchetype.MonsterOnly, size: 7 as const, attempts: 40 },
  { archetype: GeneratorArchetype.MixedOneRoom, size: 7 as const, attempts: 80 },
] as const;
const tinyA = generateCampaignReleaseReservoir(tinyPlan, 424242);
const tinyB = generateCampaignReleaseReservoir(tinyPlan, 424242);
assert(tinyA.accepted.length > 0, 'Tiny release scan should find at least one accepted V1 candidate.');
assert(tinyA.accepted.map((entry) => entry.candidate.id).join('|') === tinyB.accepted.map((entry) => entry.candidate.id).join('|'), 'Release reservoir generation must be deterministic.');
assert(tinyA.accepted.every((entry) => !getGeneratorMonsterPolicy(entry.candidate).reject), 'Release reservoir must apply the generator monster-density hard cap.');
assert(tinyA.stats.every((entry) => entry.archetype !== GeneratorArchetype.ChestTwoRooms && entry.archetype !== GeneratorArchetype.MixedTwoRooms), 'Release reservoir must not scan two-room archetypes.');

console.info('[Dungeon Logic] Campaign release sanity: reservoir generation passed');

const shape = ['#......','.#.....','..#....','...#...','....#..','.....#.','......#'];
const rotated = ['......#','.....#.','....#..','...#...','..#....','.#.....','#......'];
assert(campaignReleaseStructuralFingerprint(shape) === campaignReleaseStructuralFingerprint(rotated), 'Structural fingerprint must collapse rotation/reflection-equivalent wall masks.');

import { promotedCampaignLevels } from '../content/campaign/levels';
import { analyzeCampaignPromotion } from './CampaignPromotion';
import type { GeneratedCandidate } from '../puzzle/generator/types';

assert(promotedCampaignLevels.length === 30, 'Campaign release must contain exactly 30 promoted levels.');
const releaseFingerprints = new Set<string>();
for (let slot = 6; slot <= 30; slot += 1) {
  const source = promotedCampaignLevels.find((entry) => entry.slot === slot);
  assert(source !== undefined, `Missing promoted campaign slot ${slot}.`);
  assert(source.provenance.sourceSeed === CAMPAIGN_RELEASE_MASTER_SEED, `Slot ${slot} must preserve the release corpus master seed.`);
  const candidateSeedText = source.provenance.sourceCandidateId.split('-').at(-1);
  const candidateSeed = Number(candidateSeedText);
  assert(Number.isInteger(candidateSeed), `Slot ${slot} candidate id must end in a numeric candidate seed.`);
  assert(source.level.width === 7 && source.level.height === 7, `Slot ${slot} release level must be 7x7.`);

  const fingerprint = campaignReleaseStructuralFingerprint(source.level.solution);
  assert(!releaseFingerprints.has(fingerprint), `Slot ${slot} repeats a rotation/reflection-equivalent wall layout.`);
  releaseFingerprints.add(fingerprint);

  const candidate: GeneratedCandidate = {
    id: source.provenance.sourceCandidateId,
    seed: candidateSeed,
    archetype: source.provenance.sourceArchetype,
    size: 7,
    rooms: [],
    level: source.level,
  };
  const revalidated = analyzeCampaignPromotion(candidate, slot, promotedCampaignLevels, true);
  assert(revalidated.difficulty === source.provenance.difficulty, `Slot ${slot} difficulty provenance drifted.`);
  assert(revalidated.difficultyScore === source.provenance.difficultyScore, `Slot ${slot} difficulty score provenance drifted.`);
  assert(revalidated.humanStatus === source.provenance.humanStatus, `Slot ${slot} Human Solver provenance drifted.`);
  assert(Math.abs(revalidated.difficultyScore - CAMPAIGN_RELEASE_TARGET_SCORES[slot]) <= 2, `Slot ${slot} is too far from its release target score.`);
}

console.info('[Dungeon Logic] Campaign release sanity: promoted 006-030 revalidation + structural uniqueness passed');

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
import { analyzeHumanSolvability } from '../puzzle/human-solver/HumanSolver';
import { HumanRule } from '../puzzle/human-solver/types';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function fakeAccepted(
  id: string,
  archetype: GeneratorArchetypeValue,
  band: Exclude<DifficultyBand, 'unrated'>,
  difficultyScore: number,
  wallOffset: number,
  size: 6 | 7 | 8 = 7,
): AcceptedCandidate {
  const solution = Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x) => {
      const hash = (Math.imul(x + 1, 73856093) ^ Math.imul(y + 1, 19349663) ^ Math.imul(wallOffset + 1, 83492791)) >>> 0;
      return hash % 5 === 0 ? '#' : '.';
    }).join(''),
  );
  return {
    candidate: {
      id,
      seed: wallOffset + 1,
      archetype,
      size,
      rooms: [],
      level: {
        id,
        width: size,
        height: size,
        rowClues: Array(size).fill(1),
        columnClues: Array(size).fill(1),
        monsters: archetype === GeneratorArchetype.MonsterOnly ? [{ x: 0, y: 0 }] : [],
        chests: archetype === GeneratorArchetype.MonsterOnly ? [] : [{ x: Math.floor(size / 2), y: Math.floor(size / 2) }],
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
        basicPropagationResolvedRatio: 2 / (size * size),
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
assert(Object.keys(CAMPAIGN_RELEASE_TARGET_SCORES).length === 57, 'Catalog-curated campaign slots are 8..64 only; the handcrafted opening 1..7 stays fixed.');
assert(CAMPAIGN_RELEASE_TARGET_SCORES[7] === undefined, 'Opening slot 007 is preserved instead of reselected.');
assert(CAMPAIGN_RELEASE_TARGET_SCORES[8] === 18, 'Slot 008 bridges into the generated campaign with a larger Easy board.');
assert(CAMPAIGN_RELEASE_TARGET_SCORES[9] === 20, 'Second row opens gently before Medium reasoning.');
assert(CAMPAIGN_RELEASE_TARGET_SCORES[16] === 35, 'Second row should finish in lower Medium.');
assert(CAMPAIGN_RELEASE_TARGET_SCORES[24] === 47, 'Third row should finish at upper Medium.');
assert(CAMPAIGN_RELEASE_TARGET_SCORES[25] === 53, 'Fourth row bridges into Hard instead of jumping straight to 56+.');
assert(CAMPAIGN_RELEASE_TARGET_SCORES[64] === 73, 'Campaign finale should finish at the top of the non-Expert Hard corpus.');

const campaignTargets = Array.from({ length: 57 }, (_, index) => index + 8)
  .map((slot) => ({ slot, score: CAMPAIGN_RELEASE_TARGET_SCORES[slot]! }));
for (let index = 1; index < campaignTargets.length; index += 1) {
  const previous = campaignTargets[index - 1];
  const current = campaignTargets[index];
  const delta = current.score - previous.score;
  const startsNewRow = (current.slot - 1) % 8 === 0;
  assert(
    startsNewRow ? delta >= -2 : delta >= 0,
    `Campaign target curve regresses too sharply at slot ${current.slot}: ${previous.score} -> ${current.score}.`,
  );
  assert(
    delta <= 8,
    `Campaign target curve jumps too sharply at slot ${current.slot}: ${previous.score} -> ${current.score}.`,
  );
}
for (let slot = 8; slot <= 64; slot += 1) {
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

const selectionFixture = [
  ...fixture,
  fakeAccepted('monster-easy-18', GeneratorArchetype.MonsterOnly, 'easy', 18, 8, 8),
  fakeAccepted('monster-easy-20', GeneratorArchetype.MonsterOnly, 'easy', 20, 9, 8),
  fakeAccepted('monster-medium-28', GeneratorArchetype.MonsterOnly, 'medium', 28, 10, 6),
  fakeAccepted('mixed-medium-29', GeneratorArchetype.MixedOneRoom, 'medium', 29, 11, 6),
  fakeAccepted('monster-medium-30b', GeneratorArchetype.MonsterOnly, 'medium', 30, 12),
];
const forward = selectCampaignReleaseSlots(selectionFixture, [8, 9, 10, 11, 12]);
const reverse = selectCampaignReleaseSlots([...selectionFixture].reverse(), [8, 9, 10, 11, 12]);
assert(forward.map((entry) => entry.candidate.candidate.id).join('|') === reverse.map((entry) => entry.candidate.candidate.id).join('|'), 'Selection must not depend on reservoir input order.');
assert(new Set(forward.map((entry) => entry.candidate.candidate.id)).size === forward.length, 'A release candidate must not be reused across campaign slots.');
assert(forward.map((entry) => entry.candidate.difficulty.score).join('|') === '18|20|28|29|30', 'Selector must follow the new slot targets before optimizing diversity.');

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

assert(promotedCampaignLevels.length === 64, 'Campaign release must contain exactly 64 promoted levels.');
const releaseFingerprints = new Set<string>();
const releasePromotedSlots = Array.from({ length: 57 }, (_, index) => index + 8);
const rowArchetypes = new Map<number, Set<string>>();
const rowSizes = new Map<number, Set<number>>();
const rowAdvancedRules = new Map<number, Set<string>>();
let archetypeStreak = 0;
let previousArchetype: string | null = null;
for (const slot of releasePromotedSlots) {
  const source = promotedCampaignLevels.find((entry) => entry.slot === slot);
  assert(source !== undefined, `Missing promoted campaign slot ${slot}.`);
  const candidateSeedText = source.provenance.sourceCandidateId.split('-').at(-1);
  const candidateSeed = Number(candidateSeedText);
  assert(Number.isInteger(candidateSeed), `Slot ${slot} candidate id must end in a numeric candidate seed.`);
  assert(source.provenance.sourceSeed === candidateSeed, `Slot ${slot} catalog provenance should keep the actual generator seed.`);

  const fingerprint = campaignReleaseStructuralFingerprint(source.level.solution);
  assert(!releaseFingerprints.has(fingerprint), `Slot ${slot} repeats a rotation/reflection-equivalent wall layout.`);
  releaseFingerprints.add(fingerprint);

  const candidate: GeneratedCandidate = {
    id: source.provenance.sourceCandidateId,
    seed: candidateSeed,
    archetype: source.provenance.sourceArchetype,
    size: source.level.width as 6 | 7 | 8,
    rooms: [],
    level: source.level,
  };
  const revalidated = analyzeCampaignPromotion(candidate, slot, promotedCampaignLevels, true);
  assert(revalidated.difficulty === source.provenance.difficulty, `Slot ${slot} difficulty provenance drifted.`);
  assert(revalidated.difficultyScore === source.provenance.difficultyScore, `Slot ${slot} difficulty score provenance drifted.`);
  assert(revalidated.humanStatus === source.provenance.humanStatus, `Slot ${slot} Human Solver provenance drifted.`);
  assert(Math.abs(revalidated.difficultyScore - CAMPAIGN_RELEASE_TARGET_SCORES[slot]) <= 1, `Slot ${slot} is too far from its campaign target score.`);

  const row = Math.floor((slot - 1) / 8) + 1;
  const archetypes = rowArchetypes.get(row) ?? new Set<string>();
  archetypes.add(source.provenance.sourceArchetype);
  rowArchetypes.set(row, archetypes);
  const sizes = rowSizes.get(row) ?? new Set<number>();
  sizes.add(source.level.width);
  rowSizes.set(row, sizes);

  const human = analyzeHumanSolvability(source.level);
  const advanced = rowAdvancedRules.get(row) ?? new Set<string>();
  for (const rule of [
    HumanRule.TreasureRoomInterior,
    HumanRule.TreasureRoomEntrance,
    HumanRule.MonsterDeadEnd,
    HumanRule.HallwayNotDeadEnd,
    HumanRule.Open2x2,
    HumanRule.Connectivity,
  ]) {
    if (human.ruleCounts[rule] > 0) advanced.add(rule);
  }
  rowAdvancedRules.set(row, advanced);

  if (source.provenance.sourceArchetype === previousArchetype) archetypeStreak += 1;
  else archetypeStreak = 1;
  previousArchetype = source.provenance.sourceArchetype;
  assert(archetypeStreak <= 3, `Campaign repeats archetype ${previousArchetype} more than three times at slot ${slot}.`);
}

for (let row = 2; row <= 8; row += 1) {
  assert((rowArchetypes.get(row)?.size ?? 0) >= 2, `Campaign row ${row} should contain at least two archetypes.`);
  if (row <= 7) {
    assert((rowSizes.get(row)?.size ?? 0) >= 2, `Campaign row ${row} should contain at least two board sizes.`);
  } else {
    assert((rowSizes.get(row)?.has(8) ?? false), 'Campaign finale should settle on the largest 8x8 boards.');
  }
  assert((rowAdvancedRules.get(row)?.size ?? 0) >= 3, `Campaign row ${row} should exercise at least three advanced deduction families.`);
}

console.info('[Dungeon Logic] Campaign release sanity: catalog-curated 8..64 revalidation + row variety passed');

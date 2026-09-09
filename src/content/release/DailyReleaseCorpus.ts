import { candidateDistance, scoreCandidate } from '../../puzzle/generator/CandidateRanker';
import { getGeneratorMonsterPolicy } from '../../puzzle/generator/CandidateFactory';
import { GeneratorArchetype, type AcceptedCandidate, type GeneratorArchetype as GeneratorArchetypeValue, type GeneratorBoardSize } from '../../puzzle/generator/types';
import { analyzeHumanSolvability } from '../../puzzle/human-solver/HumanSolver';
import type { HumanSolveStatus } from '../../puzzle/human-solver/types';
import type { LevelDefinition } from '../../puzzle/types';
import { campaignReleaseStructuralFingerprint } from './CampaignReleaseSelection';
import { evaluateDailyReleaseEligibility } from './DailyReleasePolicy';

export interface DailyReleaseScanPlanEntry {
  readonly archetype: GeneratorArchetypeValue;
  readonly size: GeneratorBoardSize;
  readonly attempts: number;
}

export const DAILY_RELEASE_MASTER_SEED = 20260909;
export const DAILY_RELEASE_COUNT = 365;
export const DAILY_RELEASE_MIN_NEIGHBOR_DISTANCE = 0.18;

export const DAILY_RELEASE_SCAN_PLAN = [
  { archetype: GeneratorArchetype.MonsterOnly, size: 7, attempts: 1000 },
  { archetype: GeneratorArchetype.MixedOneRoom, size: 7, attempts: 5000 },
  { archetype: GeneratorArchetype.ChestOneRoom, size: 7, attempts: 3000 },
] as const satisfies readonly DailyReleaseScanPlanEntry[];

export const DAILY_RELEASE_ARCHETYPE_COUNTS = {
  [GeneratorArchetype.MonsterOnly]: 217,
  [GeneratorArchetype.MixedOneRoom]: 126,
  [GeneratorArchetype.ChestOneRoom]: 22,
} as const;

const MONSTER_TARGETS = [32, 38, 44, 50, 56, 62, 34, 40, 46, 52, 58, 64, 36, 42, 48, 54, 60, 66, 33, 39, 45, 51, 57, 63] as const;
const MIXED_TARGETS = [34, 40, 46, 52, 58, 64, 36, 42, 48, 54, 60, 66, 32, 38, 44, 50, 56, 62, 35, 41, 47, 53, 59, 65] as const;
const CHEST_TARGETS = [44, 48, 50, 52, 54, 56, 58, 60, 62, 64, 66, 56] as const;

export interface DailyReleaseSlotSpec {
  readonly ordinal: number;
  readonly archetype: GeneratorArchetypeValue;
  readonly targetScore: number;
}

export const DAILY_RELEASE_SLOT_SPECS: readonly DailyReleaseSlotSpec[] = buildDailyReleaseSlotSpecs();

export interface DailyReleaseCandidateAnalysis {
  readonly accepted: AcceptedCandidate;
  readonly humanStatus: HumanSolveStatus;
  readonly qualityScore: number;
  readonly structuralFingerprint: string;
}

export interface DailyReleaseAnalysisReport {
  readonly eligible: readonly DailyReleaseCandidateAnalysis[];
  readonly rejectedCount: number;
  readonly campaignCollisionCount: number;
}

export interface DailyReleaseSelectionEntry {
  readonly ordinal: number;
  readonly candidate: DailyReleaseCandidateAnalysis;
  readonly targetScore: number;
  readonly selectionScore: number;
  readonly previousDistance: number | null;
  readonly eligibleCount: number;
}

const DIFFICULTY_BONUS = 24;
const DIFFICULTY_WEIGHT = 2;
const DIVERSITY_WEIGHT = 22;

export function analyzeDailyReleaseReservoir(
  reservoir: readonly AcceptedCandidate[],
  campaignLevels: readonly LevelDefinition[],
): DailyReleaseAnalysisReport {
  const campaignFingerprints = new Set(
    campaignLevels.map((level) => campaignReleaseStructuralFingerprint(level.solution)),
  );
  const seenIds = new Set<string>();
  const eligible: DailyReleaseCandidateAnalysis[] = [];
  let rejectedCount = 0;
  let campaignCollisionCount = 0;

  for (const accepted of [...reservoir].sort(compareAcceptedIdentity)) {
    const candidate = accepted.candidate;
    if (seenIds.has(candidate.id)) {
      rejectedCount += 1;
      continue;
    }
    seenIds.add(candidate.id);

    if (getGeneratorMonsterPolicy(candidate).reject) {
      rejectedCount += 1;
      continue;
    }

    const human = analyzeHumanSolvability(candidate.level);
    const eligibility = evaluateDailyReleaseEligibility({
      archetype: candidate.archetype,
      size: candidate.size,
      difficultyBand: accepted.difficulty.band,
      difficultyScore: accepted.difficulty.score,
      humanStatus: human.status,
      blockerCount: candidate.level.blockers.length,
      doorCount: candidate.level.doors.length,
    });
    if (!eligibility.eligible) {
      rejectedCount += 1;
      continue;
    }

    const structuralFingerprint = campaignReleaseStructuralFingerprint(candidate.level.solution);
    if (campaignFingerprints.has(structuralFingerprint)) {
      campaignCollisionCount += 1;
      continue;
    }

    eligible.push({
      accepted,
      humanStatus: human.status,
      qualityScore: scoreCandidate(accepted),
      structuralFingerprint,
    });
  }

  return {
    eligible,
    rejectedCount,
    campaignCollisionCount,
  };
}

export function selectDailyReleaseCorpus(
  reservoir: readonly DailyReleaseCandidateAnalysis[],
  limit = DAILY_RELEASE_COUNT,
): readonly DailyReleaseSelectionEntry[] {
  if (!Number.isInteger(limit) || limit < 0 || limit > DAILY_RELEASE_COUNT) {
    throw new RangeError(`Daily release limit must be an integer from 0 to ${DAILY_RELEASE_COUNT}.`);
  }

  const selected: DailyReleaseSelectionEntry[] = [];
  const usedIds = new Set<string>();
  const usedFingerprints = new Set<string>();

  for (const spec of DAILY_RELEASE_SLOT_SPECS.slice(0, limit)) {
    const eligible = reservoir
      .filter((entry) => entry.accepted.candidate.archetype === spec.archetype)
      .filter((entry) => !usedIds.has(entry.accepted.candidate.id))
      .filter((entry) => !usedFingerprints.has(entry.structuralFingerprint));

    if (eligible.length === 0) {
      throw new Error(`No eligible Daily release candidates for ordinal ${spec.ordinal} (${spec.archetype}).`);
    }

    const previous = selected.at(-1)?.candidate.accepted ?? null;
    const diverse = previous === null
      ? eligible
      : eligible.filter((entry) => candidateDistance(entry.accepted, previous) >= DAILY_RELEASE_MIN_NEIGHBOR_DISTANCE);
    const candidates = diverse.length > 0 ? diverse : eligible;

    const ranked = [...candidates].sort((left, right) => {
      const leftScore = calculateSelectionScore(left, selected, spec.targetScore);
      const rightScore = calculateSelectionScore(right, selected, spec.targetScore);
      return (
        rightScore - leftScore
        || right.qualityScore - left.qualityScore
        || compareText(left.accepted.candidate.id, right.accepted.candidate.id)
        || left.accepted.candidate.seed - right.accepted.candidate.seed
      );
    });

    const picked = ranked[0];
    const previousDistance = previous === null ? null : candidateDistance(picked.accepted, previous);
    usedIds.add(picked.accepted.candidate.id);
    usedFingerprints.add(picked.structuralFingerprint);
    selected.push({
      ordinal: spec.ordinal,
      candidate: picked,
      targetScore: spec.targetScore,
      selectionScore: calculateSelectionScore(picked, selected, spec.targetScore),
      previousDistance,
      eligibleCount: eligible.length,
    });
  }

  return selected;
}

function buildDailyReleaseSlotSpecs(): readonly DailyReleaseSlotSpec[] {
  const initialPattern = [
    GeneratorArchetype.MonsterOnly,
    GeneratorArchetype.MixedOneRoom,
    GeneratorArchetype.ChestOneRoom,
    GeneratorArchetype.MixedOneRoom,
    GeneratorArchetype.MonsterOnly,
  ] as const;
  const initialIndexes = {
    [GeneratorArchetype.MonsterOnly]: 0,
    [GeneratorArchetype.MixedOneRoom]: 0,
    [GeneratorArchetype.ChestOneRoom]: 0,
  };
  const initialTargetLists = {
    [GeneratorArchetype.MonsterOnly]: MONSTER_TARGETS,
    [GeneratorArchetype.MixedOneRoom]: MIXED_TARGETS,
    [GeneratorArchetype.ChestOneRoom]: CHEST_TARGETS,
  } as const;

  const initial = Array.from({ length: 60 }, (_, index): DailyReleaseSlotSpec => {
    const archetype = initialPattern[index % initialPattern.length];
    const targetIndex = initialIndexes[archetype];
    const targetScore = initialTargetLists[archetype][targetIndex];
    if (targetScore === undefined) throw new Error(`Daily release target list exhausted for ${archetype}.`);
    initialIndexes[archetype] += 1;
    return { ordinal: index + 1, archetype, targetScore };
  });

  const futureTargetCycles = {
    [GeneratorArchetype.MonsterOnly]: [34, 40, 46, 52, 58, 64, 36, 42, 48, 54, 60, 66] as const,
    [GeneratorArchetype.MixedOneRoom]: [34, 40, 46, 52, 58, 64, 36, 42, 48, 54, 60, 66] as const,
    [GeneratorArchetype.ChestOneRoom]: [44, 48, 52, 56, 60, 64, 66, 58] as const,
  };
  const futureIndexes = {
    [GeneratorArchetype.MonsterOnly]: 0,
    [GeneratorArchetype.MixedOneRoom]: 0,
    [GeneratorArchetype.ChestOneRoom]: 0,
  };
  const future = Array.from({ length: DAILY_RELEASE_COUNT - 60 }, (_, index): DailyReleaseSlotSpec => {
    const archetype = index % 30 === 29
      ? GeneratorArchetype.ChestOneRoom
      : index % 3 === 1
        ? GeneratorArchetype.MixedOneRoom
        : GeneratorArchetype.MonsterOnly;
    const targetList = futureTargetCycles[archetype];
    const targetScore = targetList[futureIndexes[archetype] % targetList.length];
    futureIndexes[archetype] += 1;
    return { ordinal: index + 61, archetype, targetScore };
  });

  return [...initial, ...future];
}

function calculateSelectionScore(
  entry: DailyReleaseCandidateAnalysis,
  selected: readonly DailyReleaseSelectionEntry[],
  targetScore: number,
): number {
  const score = entry.accepted.difficulty.score;
  if (score === null) return Number.NEGATIVE_INFINITY;
  const difficultyBonus = Math.max(0, DIFFICULTY_BONUS - Math.abs(score - targetScore) * DIFFICULTY_WEIGHT);
  const recent = selected.slice(-4);
  const diversity = recent.length === 0
    ? 0
    : Math.min(...recent.map((existing) => candidateDistance(entry.accepted, existing.candidate.accepted)));
  return round(entry.qualityScore + difficultyBonus + diversity * DIVERSITY_WEIGHT);
}

function compareAcceptedIdentity(left: AcceptedCandidate, right: AcceptedCandidate): number {
  return compareText(left.candidate.id, right.candidate.id) || left.candidate.seed - right.candidate.seed;
}

function compareText(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

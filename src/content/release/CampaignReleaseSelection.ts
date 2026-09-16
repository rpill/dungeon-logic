import { GeneratorArchetype, type GeneratorArchetype as GeneratorArchetypeValue, type GeneratorBoardSize } from '../../puzzle/generator/types';

export interface CampaignReleaseScanPlanEntry {
  readonly archetype: GeneratorArchetypeValue;
  readonly size: GeneratorBoardSize;
  readonly attempts: number;
}

export const CAMPAIGN_RELEASE_MASTER_SEED = 20260908;
export const CAMPAIGN_RELEASE_MIN_NEIGHBOR_DISTANCE = 0.28;

export const CAMPAIGN_RELEASE_SCAN_PLAN = [
  { archetype: GeneratorArchetype.MonsterOnly, size: 7, attempts: 1500 },
  { archetype: GeneratorArchetype.MixedOneRoom, size: 7, attempts: 5000 },
  { archetype: GeneratorArchetype.ChestOneRoom, size: 7, attempts: 2000 },
] as const satisfies readonly CampaignReleaseScanPlanEntry[];

export const CAMPAIGN_RELEASE_TARGET_SCORES: Readonly<Record<number, number>> = {
  8: 18,
  9: 20,
  10: 28,
  11: 29,
  12: 30,
  13: 31,
  14: 32,
  15: 34,
  16: 35,
  17: 34,
  18: 35,
  19: 39,
  20: 40,
  21: 41,
  22: 43,
  23: 45,
  24: 47,
  25: 53,
  26: 54,
  27: 55,
  28: 56,
  29: 57,
  30: 58,
  31: 59,
  32: 60,
  33: 59,
  34: 60,
  35: 61,
  36: 62,
  37: 63,
  38: 64,
  39: 65,
  40: 66,
  41: 64,
  42: 65,
  43: 66,
  44: 67,
  45: 67,
  46: 68,
  47: 69,
  48: 70,
  49: 68,
  50: 69,
  51: 69,
  52: 70,
  53: 70,
  54: 71,
  55: 71,
  56: 72,
  57: 70,
  58: 71,
  59: 71,
  60: 72,
  61: 72,
  62: 73,
  63: 73,
  64: 73,
};

import { getCampaignCurationRule } from '../campaign/curationPlan';
import { getGeneratorMonsterPolicy } from '../../puzzle/generator/CandidateFactory';
import { candidateDistance, scoreCandidate } from '../../puzzle/generator/CandidateRanker';
import type { AcceptedCandidate } from '../../puzzle/generator/types';

export interface CampaignReleaseSelectionEntry {
  readonly slot: number;
  readonly candidate: AcceptedCandidate;
  readonly targetScore: number;
  readonly qualityScore: number;
  readonly selectionScore: number;
  readonly previousDistance: number | null;
  readonly eligibleCount: number;
  readonly usedDiversityFallback: boolean;
}

const CAMPAIGN_RELEASE_DIFFICULTY_WEIGHT = 2;
const CAMPAIGN_RELEASE_DIFFICULTY_BONUS = 20;
const CAMPAIGN_RELEASE_DIVERSITY_WEIGHT = 24;

export function selectCampaignReleaseSlots(
  reservoir: readonly AcceptedCandidate[],
  slots: readonly number[] = Array.from({ length: 57 }, (_, index) => index + 8),
): readonly CampaignReleaseSelectionEntry[] {
  const orderedSlots = [...slots];
  const seenSlots = new Set<number>();
  const usedCandidateIds = new Set<string>();
  const usedStructuralFingerprints = new Set<string>();
  const selected: CampaignReleaseSelectionEntry[] = [];

  for (const slot of orderedSlots) {
    if (!Number.isInteger(slot) || slot < 8 || slot > 64) {
      throw new RangeError(`Campaign release slot must be an integer from 8 to 64; got ${slot}.`);
    }
    if (seenSlots.has(slot)) {
      throw new Error(`Duplicate campaign release slot: ${slot}.`);
    }
    seenSlots.add(slot);

    const targetScore = CAMPAIGN_RELEASE_TARGET_SCORES[slot];
    if (targetScore === undefined) {
      throw new Error(`No campaign release target score for slot ${slot}.`);
    }

    const rule = getCampaignCurationRule(slot);
    const eligible = reservoir
      .filter((candidate) => !usedCandidateIds.has(candidate.candidate.id))
      .filter((candidate) => !usedStructuralFingerprints.has(campaignReleaseStructuralFingerprint(candidate.candidate.level.solution)))
      .filter((candidate) => !getGeneratorMonsterPolicy(candidate.candidate).reject)
      .filter((candidate) => matchesCampaignReleaseRule(candidate, rule));

    if (eligible.length === 0) {
      throw new Error(`No eligible release candidates for campaign slot ${slot}.`);
    }

    const bestDifficultyDelta = Math.min(
      ...eligible.map((candidate) => Math.abs((candidate.difficulty.score ?? 100) - targetScore)),
    );
    if (bestDifficultyDelta > 2) {
      throw new Error(
        `Campaign release corpus cannot satisfy slot ${slot}: nearest difficulty is ${bestDifficultyDelta} points from target ${targetScore}.`,
      );
    }
    const difficultyMatched = eligible.filter(
      (candidate) => Math.abs((candidate.difficulty.score ?? 100) - targetScore) <= bestDifficultyDelta,
    );

    const previous = selected.at(-1)?.candidate ?? null;
    let candidates = difficultyMatched;
    let usedDiversityFallback = false;

    if (previous !== null) {
      const diverse = difficultyMatched.filter(
        (candidate) => candidateDistance(candidate, previous) >= CAMPAIGN_RELEASE_MIN_NEIGHBOR_DISTANCE,
      );
      if (diverse.length > 0) {
        candidates = diverse;
      } else {
        usedDiversityFallback = true;
      }
    }

    const ranked = [...candidates].sort((left, right) => {
      const leftSelectionScore = calculateCampaignReleaseSelectionScore(left, selected, targetScore);
      const rightSelectionScore = calculateCampaignReleaseSelectionScore(right, selected, targetScore);
      return (
        rightSelectionScore - leftSelectionScore
        || scoreCandidate(right) - scoreCandidate(left)
        || compareText(left.candidate.id, right.candidate.id)
        || left.candidate.seed - right.candidate.seed
      );
    });

    const picked = ranked[0];
    const previousDistance = previous === null ? null : candidateDistance(picked, previous);
    const qualityScore = scoreCandidate(picked);
    const selectionScore = calculateCampaignReleaseSelectionScore(picked, selected, targetScore);

    usedCandidateIds.add(picked.candidate.id);
    usedStructuralFingerprints.add(campaignReleaseStructuralFingerprint(picked.candidate.level.solution));
    selected.push({
      slot,
      candidate: picked,
      targetScore,
      qualityScore,
      selectionScore,
      previousDistance,
      eligibleCount: eligible.length,
      usedDiversityFallback,
    });
  }

  return selected;
}

function matchesCampaignReleaseRule(
  candidate: AcceptedCandidate,
  rule: ReturnType<typeof getCampaignCurationRule>,
): boolean {
  const difficulty = candidate.difficulty.band;
  return (
    difficulty !== 'unrated'
    && rule.allowedArchetypes.includes(candidate.candidate.archetype)
    && rule.allowedDifficulties.includes(difficulty)
    && rule.allowedSizes.includes(candidate.candidate.size)
  );
}

function calculateCampaignReleaseSelectionScore(
  candidate: AcceptedCandidate,
  selected: readonly CampaignReleaseSelectionEntry[],
  targetScore: number,
): number {
  const difficultyScore = candidate.difficulty.score;
  if (difficultyScore === null) return Number.NEGATIVE_INFINITY;

  const difficultyBonus = Math.max(
    0,
    CAMPAIGN_RELEASE_DIFFICULTY_BONUS
      - Math.abs(difficultyScore - targetScore) * CAMPAIGN_RELEASE_DIFFICULTY_WEIGHT,
  );

  const recent = selected.slice(-3);
  const diversity = recent.length === 0
    ? 0
    : Math.min(...recent.map((entry) => candidateDistance(candidate, entry.candidate)));

  return roundReleaseScore(
    scoreCandidate(candidate)
      + difficultyBonus
      + diversity * CAMPAIGN_RELEASE_DIVERSITY_WEIGHT,
  );
}

function compareText(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function roundReleaseScore(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}


export function campaignReleaseStructuralFingerprint(
  solution: readonly string[],
): string {
  if (solution.length === 0) return '';
  const size = solution.length;
  if (solution.some((row) => row.length !== size)) {
    throw new Error('Campaign release structural fingerprint requires a square solution grid.');
  }

  const base = solution.map((row) => [...row]);
  const variants: string[] = [];
  let rotated = base;

  for (let turn = 0; turn < 4; turn += 1) {
    variants.push(serializeMask(rotated));
    variants.push(serializeMask(reflectMask(rotated)));
    rotated = rotateMask(rotated);
  }

  variants.sort(compareText);
  return variants[0];
}

function rotateMask(mask: readonly (readonly string[])[]): string[][] {
  const size = mask.length;
  return Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x) => mask[size - 1 - x][y]),
  );
}

function reflectMask(mask: readonly (readonly string[])[]): string[][] {
  return mask.map((row) => [...row].reverse());
}

function serializeMask(mask: readonly (readonly string[])[]): string {
  return mask.map((row) => row.join('')).join('|');
}

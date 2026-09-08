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
  6: 14,
  7: 15,
  8: 30,
  9: 31,
  10: 30,
  11: 32,
  12: 43,
  13: 44,
  14: 55,
  15: 44,
  16: 57,
  17: 45,
  18: 58,
  19: 56,
  20: 60,
  21: 59,
  22: 62,
  23: 57,
  24: 61,
  25: 60,
  26: 62,
  27: 64,
  28: 64,
  29: 66,
  30: 69,
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
  slots: readonly number[] = Array.from({ length: 25 }, (_, index) => index + 6),
): readonly CampaignReleaseSelectionEntry[] {
  const orderedSlots = [...slots];
  const seenSlots = new Set<number>();
  const usedCandidateIds = new Set<string>();
  const usedStructuralFingerprints = new Set<string>();
  const selected: CampaignReleaseSelectionEntry[] = [];

  for (const slot of orderedSlots) {
    if (!Number.isInteger(slot) || slot < 6 || slot > 30) {
      throw new RangeError(`Campaign release slot must be an integer from 6 to 30; got ${slot}.`);
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

    const previous = selected.at(-1)?.candidate ?? null;
    let candidates = eligible;
    let usedDiversityFallback = false;

    if (previous !== null) {
      const diverse = eligible.filter(
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

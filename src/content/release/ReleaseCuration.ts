import { getCampaignCurationRule } from '../campaign/curationPlan';
import type { CampaignCurationRule } from '../campaign/types';
import { evaluateCandidate } from '../../puzzle/generator/CandidateFactory';
import {
  candidateDistance,
  scoreCandidate,
} from '../../puzzle/generator/CandidateRanker';
import type {
  AcceptedCandidate,
  GeneratedCandidate,
} from '../../puzzle/generator/types';
import { analyzeHumanSolvability } from '../../puzzle/human-solver/HumanSolver';
import type { HumanSolveStatus } from '../../puzzle/human-solver/types';
import {
  evaluateDailyReleaseEligibility,
  V1_RELEASE_ARCHETYPES,
  type DailyReleaseEligibility,
} from './DailyReleasePolicy';

export type ReleaseRejectionReason =
  | 'duplicate-candidate-id'
  | 'canonical-invalid'
  | 'canonical-non-unique'
  | 'canonical-hard-quality'
  | 'canonical-geometry-warning'
  | 'archetype-not-in-v1'
  | 'forbidden-release-mechanic'
  | 'metadata-size-mismatch'
  | 'not-human-solved';

export interface ReleaseCandidateAnalysis {
  readonly candidate: GeneratedCandidate;
  readonly accepted: AcceptedCandidate;
  readonly humanStatus: HumanSolveStatus;
  readonly qualityScore: number;
  readonly dailyEligibility: DailyReleaseEligibility;
}

export interface ReleaseCandidateRejection {
  readonly candidateId: string;
  readonly seed: number;
  readonly reason: ReleaseRejectionReason;
  readonly diagnostic: string;
}

export interface ReleaseReservoirReport {
  readonly accepted: readonly ReleaseCandidateAnalysis[];
  readonly rejected: readonly ReleaseCandidateRejection[];
}

export interface DailyReleaseSelection {
  readonly selected: readonly ReleaseCandidateAnalysis[];
  readonly reservoir: readonly ReleaseCandidateAnalysis[];
  readonly eligibleCount: number;
}

const DIVERSITY_WEIGHT = 20;

export function analyzeReleaseCandidates(
  candidates: readonly GeneratedCandidate[],
): ReleaseReservoirReport {
  const accepted: ReleaseCandidateAnalysis[] = [];
  const rejected: ReleaseCandidateRejection[] = [];

  const ordered = [...candidates].sort(compareCandidateIdentity);
  const seenCandidateIds = new Set<string>();

  for (const candidate of ordered) {
    if (seenCandidateIds.has(candidate.id)) {
      rejected.push({
        candidateId: candidate.id,
        seed: candidate.seed,
        reason: 'duplicate-candidate-id',
        diagnostic: `Duplicate release candidate id: ${candidate.id}.`,
      });
      continue;
    }
    seenCandidateIds.add(candidate.id);

    const evaluation = evaluateCandidate(candidate);
    if (evaluation.status !== 'accepted') {
      rejected.push({
        candidateId: candidate.id,
        seed: candidate.seed,
        reason: `canonical-${evaluation.status}`,
        diagnostic: evaluation.diagnostic,
      });
      continue;
    }

    if (!isV1ReleaseArchetype(candidate.archetype)) {
      rejected.push({
        candidateId: candidate.id,
        seed: candidate.seed,
        reason: 'archetype-not-in-v1',
        diagnostic: `${candidate.archetype} is not a release-v1 archetype.`,
      });
      continue;
    }

    if (candidate.level.blockers.length > 0 || candidate.level.doors.length > 0) {
      rejected.push({
        candidateId: candidate.id,
        seed: candidate.seed,
        reason: 'forbidden-release-mechanic',
        diagnostic: 'Release v1 excludes Blockers and Directional Doors.',
      });
      continue;
    }

    if (
      candidate.level.width !== candidate.size
      || candidate.level.height !== candidate.size
    ) {
      rejected.push({
        candidateId: candidate.id,
        seed: candidate.seed,
        reason: 'metadata-size-mismatch',
        diagnostic: `Candidate metadata says ${candidate.size}, level is ${candidate.level.width}x${candidate.level.height}.`,
      });
      continue;
    }

    const human = analyzeHumanSolvability(candidate.level);
    if (human.status !== 'solved-direct' && human.status !== 'solved-with-contradiction') {
      rejected.push({
        candidateId: candidate.id,
        seed: candidate.seed,
        reason: 'not-human-solved',
        diagnostic: `Human Solver status is ${human.status}.`,
      });
      continue;
    }

    const acceptedCandidate = evaluation.accepted;
    accepted.push({
      candidate,
      accepted: acceptedCandidate,
      humanStatus: human.status,
      qualityScore: scoreCandidate(acceptedCandidate),
      dailyEligibility: evaluateDailyReleaseEligibility({
        archetype: candidate.archetype,
        size: candidate.size,
        difficultyBand: acceptedCandidate.difficulty.band,
        difficultyScore: acceptedCandidate.difficulty.score,
        humanStatus: human.status,
        blockerCount: candidate.level.blockers.length,
        doorCount: candidate.level.doors.length,
      }),
    });
  }

  return {
    accepted,
    rejected,
  };
}

export function rankCampaignSlotCandidates(
  reservoir: readonly ReleaseCandidateAnalysis[],
  slot: number,
  limit = 12,
): readonly ReleaseCandidateAnalysis[] {
  validateLimit(limit);
  if (limit === 0) return [];

  const rule = getCampaignCurationRule(slot);
  const eligible = reservoir.filter((entry) => matchesCampaignRule(entry, rule));
  return selectDiverse(eligible, limit);
}

export function selectDailyReleaseShortlist(
  reservoir: readonly ReleaseCandidateAnalysis[],
  limit = 60,
): DailyReleaseSelection {
  validateLimit(limit);

  const eligible = reservoir.filter((entry) => entry.dailyEligibility.eligible);
  const selected = selectDiverse(eligible, limit);
  const selectedIds = new Set(selected.map((entry) => entry.candidate.id));

  return {
    selected,
    reservoir: [...reservoir]
      .filter((entry) => !selectedIds.has(entry.candidate.id))
      .sort(compareAnalysisIdentity),
    eligibleCount: eligible.length,
  };
}

function matchesCampaignRule(
  entry: ReleaseCandidateAnalysis,
  rule: CampaignCurationRule,
): boolean {
  const difficulty = entry.accepted.difficulty.band;
  return (
    rule.allowedArchetypes.includes(entry.candidate.archetype)
    && difficulty !== 'unrated'
    && rule.allowedDifficulties.includes(difficulty)
    && rule.allowedSizes.includes(entry.candidate.size)
  );
}

function selectDiverse(
  entries: readonly ReleaseCandidateAnalysis[],
  limit: number,
): readonly ReleaseCandidateAnalysis[] {
  if (limit === 0 || entries.length === 0) return [];

  const remaining = [...entries].sort(compareBaselinePreference);
  const selected: ReleaseCandidateAnalysis[] = [];

  while (selected.length < limit && remaining.length > 0) {
    let bestIndex = 0;
    let bestScore = selectionScore(remaining[0], selected);

    for (let index = 1; index < remaining.length; index += 1) {
      const candidate = remaining[index];
      const score = selectionScore(candidate, selected);
      if (
        score > bestScore
        || (
          score === bestScore
          && compareBaselinePreference(candidate, remaining[bestIndex]) < 0
        )
      ) {
        bestIndex = index;
        bestScore = score;
      }
    }

    const [picked] = remaining.splice(bestIndex, 1);
    selected.push(picked);
  }

  return selected;
}

function selectionScore(
  entry: ReleaseCandidateAnalysis,
  selected: readonly ReleaseCandidateAnalysis[],
): number {
  if (selected.length === 0) return entry.qualityScore;

  let minDistance = 1;
  for (const existing of selected) {
    minDistance = Math.min(
      minDistance,
      candidateDistance(entry.accepted, existing.accepted),
    );
  }

  return round(entry.qualityScore + minDistance * DIVERSITY_WEIGHT);
}

function compareBaselinePreference(
  left: ReleaseCandidateAnalysis,
  right: ReleaseCandidateAnalysis,
): number {
  return (
    right.qualityScore - left.qualityScore
    || compareAnalysisIdentity(left, right)
  );
}

function compareAnalysisIdentity(
  left: ReleaseCandidateAnalysis,
  right: ReleaseCandidateAnalysis,
): number {
  return compareCandidateIdentity(left.candidate, right.candidate);
}

function compareCandidateIdentity(
  left: GeneratedCandidate,
  right: GeneratedCandidate,
): number {
  return (
    compareText(left.id, right.id)
    || left.seed - right.seed
    || left.size - right.size
    || compareText(left.archetype, right.archetype)
  );
}

function compareText(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function isV1ReleaseArchetype(
  archetype: GeneratedCandidate['archetype'],
): archetype is typeof V1_RELEASE_ARCHETYPES[number] {
  return V1_RELEASE_ARCHETYPES.some((value) => value === archetype);
}

function validateLimit(limit: number): void {
  if (!Number.isInteger(limit) || limit < 0) {
    throw new RangeError('release shortlist limit must be a non-negative integer.');
  }
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

import {
  DifficultyBand,
} from '../../puzzle/difficulty/types';
import {
  campaignReleaseStructuralFingerprint,
} from '../../content/release/CampaignReleaseSelection';
import {
  evaluateCandidate,
} from '../../puzzle/generator/CandidateFactory';
import {
  generateCandidate,
} from '../../puzzle/generator/CandidateGenerator';
import {
  createCandidateDiversitySignature,
  scoreCandidate,
} from '../../puzzle/generator/CandidateRanker';
import {
  CandidateStatus,
} from '../../puzzle/generator/types';
import type {
  EndlessCrossPoolFingerprints,
} from './CrossPoolFingerprints';
import {
  deriveEndlessCandidateSeed,
} from './ScanPlan';
import type {
  EndlessLaneScanResult,
  EndlessRejectionReason,
  EndlessReservoirEntry,
  EndlessScanLane,
} from './types';

export interface ScanEndlessLaneOptions {
  readonly masterSeed: number;
  readonly lane: EndlessScanLane;
  readonly crossPool: EndlessCrossPoolFingerprints;
  readonly seenCandidateIds: Set<string>;
  readonly seenStructuralFingerprints: Set<string>;
}

export function scanEndlessLane(
  options: ScanEndlessLaneOptions,
): EndlessLaneScanResult {
  const {
    masterSeed,
    lane,
    crossPool,
    seenCandidateIds,
    seenStructuralFingerprints,
  } = options;

  if (
    !Number.isInteger(lane.startAttempt) ||
    lane.startAttempt < 0 ||
    !Number.isInteger(lane.attemptCount) ||
    lane.attemptCount < 0
  ) {
    throw new RangeError(
      `Invalid Endless lane attempt range for ${lane.id}.`,
    );
  }

  const accepted: EndlessReservoirEntry[] = [];
  const rejectionCounts = createRejectionCounts();

  const endAttempt =
    lane.startAttempt + lane.attemptCount;

  for (
    let attempt = lane.startAttempt;
    attempt < endAttempt;
    attempt += 1
  ) {
    const seed = deriveEndlessCandidateSeed(
      masterSeed,
      lane,
      attempt,
    );
    const generated = generateCandidate({
      archetype: lane.archetype,
      size: lane.size,
      seed,
    });

    if (!generated.ok) {
      rejectionCounts['generation-failed'] += 1;
      continue;
    }

    const candidate = generated.candidate;
    if (seenCandidateIds.has(candidate.id)) {
      rejectionCounts['duplicate-candidate-id'] += 1;
      continue;
    }

    const evaluation = evaluateCandidate(candidate);
    if (evaluation.status !== CandidateStatus.Accepted) {
      rejectionCounts[evaluation.status] += 1;
      continue;
    }

    const difficulty = evaluation.accepted.difficulty;
    if (
      difficulty.band === DifficultyBand.Unrated ||
      difficulty.score === null
    ) {
      rejectionCounts.unrated += 1;
      continue;
    }

    const structuralFingerprint =
      campaignReleaseStructuralFingerprint(
        candidate.level.solution,
      );

    if (
      crossPool.campaign.has(
        structuralFingerprint,
      )
    ) {
      rejectionCounts['campaign-collision'] += 1;
      continue;
    }
    if (
      crossPool.daily.has(
        structuralFingerprint,
      )
    ) {
      rejectionCounts['daily-collision'] += 1;
      continue;
    }
    if (
      seenStructuralFingerprints.has(
        structuralFingerprint,
      )
    ) {
      rejectionCounts['structural-duplicate'] += 1;
      continue;
    }

    const entry: EndlessReservoirEntry = {
      laneIndex: lane.index,
      laneId: lane.id,
      attempt,
      seed: candidate.seed,
      candidateId: candidate.id,
      archetype: candidate.archetype,
      size: candidate.size,
      difficultyScore: difficulty.score,
      difficultyBand: difficulty.band,
      qualityScore: scoreCandidate(
        evaluation.accepted,
      ),
      structuralFingerprint,
      diversity: createCandidateDiversitySignature(
        evaluation.accepted,
      ),
    };

    seenCandidateIds.add(candidate.id);
    seenStructuralFingerprints.add(
      structuralFingerprint,
    );
    accepted.push(entry);
  }

  return {
    lane,
    attempts: lane.attemptCount,
    accepted,
    rejectionCounts,
  };
}

export function createRejectionCounts(): Record<EndlessRejectionReason, number> {
  return {
    'generation-failed': 0,
    'duplicate-candidate-id': 0,
    invalid: 0,
    'non-unique': 0,
    'hard-quality': 0,
    'geometry-warning': 0,
    unrated: 0,
    'campaign-collision': 0,
    'daily-collision': 0,
    'structural-duplicate': 0,
  };
}

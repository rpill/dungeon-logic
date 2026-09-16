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
  scoreCandidate,
} from '../../puzzle/generator/CandidateRanker';
import {
  CandidateStatus,
} from '../../puzzle/generator/types';
import type {
  EndlessSelectionRecord,
  EndlessVerificationFailure,
} from './types';

export function verifyEndlessSelectionEntry(
  entry: EndlessSelectionRecord,
): readonly EndlessVerificationFailure[] {
  const failures: EndlessVerificationFailure[] = [];
  const fail = (reason: string): void => {
    failures.push({
      ordinal: entry.ordinal,
      candidateId: entry.candidateId,
      reason,
    });
  };

  const generated = generateCandidate({
    seed: entry.seed,
    archetype: entry.archetype,
    size: entry.size,
  });
  if (!generated.ok) {
    fail('generation-failed');
    return failures;
  }

  if (
    generated.candidate.id !==
    entry.candidateId
  ) {
    fail('candidate-id-mismatch');
  }

  const evaluation = evaluateCandidate(
    generated.candidate,
  );
  if (
    evaluation.status !==
    CandidateStatus.Accepted
  ) {
    fail(`evaluation-${evaluation.status}`);
    return failures;
  }

  const difficulty =
    evaluation.accepted.difficulty;
  if (
    difficulty.score !==
      entry.difficultyScore ||
    difficulty.band !==
      entry.difficultyBand
  ) {
    fail('difficulty-mismatch');
  }

  const qualityScore = scoreCandidate(
    evaluation.accepted,
  );
  if (qualityScore !== entry.qualityScore) {
    fail('quality-score-mismatch');
  }

  const fingerprint =
    campaignReleaseStructuralFingerprint(
      generated.candidate.level.solution,
    );
  if (
    fingerprint !==
    entry.structuralFingerprint
  ) {
    fail('fingerprint-mismatch');
  }

  return failures;
}

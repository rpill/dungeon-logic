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
  EndlessCrossPoolFingerprints,
} from './CrossPoolFingerprints';
import {
  hashEndlessSelection,
} from './SelectionHash';
import type {
  EndlessSelectionRecord,
  EndlessVerificationFailure,
  EndlessVerificationReport,
} from './types';

export function verifyEndlessSelection(
  entries: readonly EndlessSelectionRecord[],
  crossPool: EndlessCrossPoolFingerprints,
): EndlessVerificationReport {
  const failures: EndlessVerificationFailure[] = [];
  const seenIds = new Set<string>();
  const seenFingerprints = new Set<string>();
  let verifiedCount = 0;
  let duplicateCount = 0;
  let campaignCollisionCount = 0;
  let dailyCollisionCount = 0;

  for (const entry of entries) {
    let failed = false;
    const fail = (reason: string): void => {
      failures.push({
        ordinal: entry.ordinal,
        candidateId: entry.candidateId,
        reason,
      });
      failed = true;
    };

    if (seenIds.has(entry.candidateId)) {
      duplicateCount += 1;
      fail('duplicate-candidate-id');
    } else {
      seenIds.add(entry.candidateId);
    }

    if (
      seenFingerprints.has(
        entry.structuralFingerprint,
      )
    ) {
      duplicateCount += 1;
      fail('duplicate-structural-fingerprint');
    } else {
      seenFingerprints.add(
        entry.structuralFingerprint,
      );
    }

    if (
      crossPool.campaign.has(
        entry.structuralFingerprint,
      )
    ) {
      campaignCollisionCount += 1;
      fail('campaign-collision');
    }
    if (
      crossPool.daily.has(
        entry.structuralFingerprint,
      )
    ) {
      dailyCollisionCount += 1;
      fail('daily-collision');
    }

    const generated = generateCandidate({
      seed: entry.seed,
      archetype: entry.archetype,
      size: entry.size,
    });
    if (!generated.ok) {
      fail('generation-failed');
      continue;
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
      continue;
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

    if (!failed) {
      verifiedCount += 1;
    }
  }

  const rejectedVerificationCount =
    entries.length - verifiedCount;

  return {
    selectionHash: hashEndlessSelection(entries),
    ok:
      rejectedVerificationCount === 0 &&
      duplicateCount === 0 &&
      campaignCollisionCount === 0 &&
      dailyCollisionCount === 0,
    verifiedCount,
    rejectedVerificationCount,
    duplicateCount,
    campaignCollisionCount,
    dailyCollisionCount,
    failures,
  };
}

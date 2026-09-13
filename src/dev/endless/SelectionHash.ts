import {
  createHash,
} from 'node:crypto';

import type {
  EndlessSelectionRecord,
} from './types';

export function hashEndlessSelection(
  selection: readonly EndlessSelectionRecord[],
): string {
  const hash = createHash('sha256');
  for (const entry of selection) {
    hash.update(
      JSON.stringify({
        ordinal: entry.ordinal,
        laneIndex: entry.laneIndex,
        laneId: entry.laneId,
        attempt: entry.attempt,
        seed: entry.seed,
        candidateId: entry.candidateId,
        archetype: entry.archetype,
        size: entry.size,
        difficultyScore: entry.difficultyScore,
        difficultyBand: entry.difficultyBand,
        qualityScore: entry.qualityScore,
        structuralFingerprint:
          entry.structuralFingerprint,
        targetScore: entry.targetScore,
        selectionScore: entry.selectionScore,
        previousDistance: entry.previousDistance,
      }),
      'utf8',
    );
    hash.update('\n', 'utf8');
  }
  return hash.digest('hex');
}

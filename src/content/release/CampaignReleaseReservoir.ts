import { evaluateCandidate, getGeneratorMonsterPolicy } from '../../puzzle/generator/CandidateFactory';
import { generateCandidate } from '../../puzzle/generator/CandidateGenerator';
import { deriveCandidateSeed } from '../../puzzle/generator/SeededRandom';
import { GeneratorArchetype, type AcceptedCandidate, type CandidateStatus } from '../../puzzle/generator/types';
import {
  CAMPAIGN_RELEASE_MASTER_SEED,
  CAMPAIGN_RELEASE_SCAN_PLAN,
  type CampaignReleaseScanPlanEntry,
} from './CampaignReleaseSelection';

export interface CampaignReleaseScanStats {
  readonly archetype: CampaignReleaseScanPlanEntry['archetype'];
  readonly size: CampaignReleaseScanPlanEntry['size'];
  readonly attempts: number;
  readonly generated: number;
  readonly accepted: number;
  readonly generationFailed: number;
  readonly duplicateRejected: number;
  readonly monsterDensityRejected: number;
  readonly evaluationRejected: Readonly<Record<Exclude<CandidateStatus, 'accepted'>, number>>;
}

export interface CampaignReleaseReservoirReport {
  readonly masterSeed: number;
  readonly accepted: readonly AcceptedCandidate[];
  readonly stats: readonly CampaignReleaseScanStats[];
}

const V1_CAMPAIGN_ARCHETYPES = new Set<CampaignReleaseScanPlanEntry['archetype']>([
  GeneratorArchetype.MonsterOnly,
  GeneratorArchetype.ChestOneRoom,
  GeneratorArchetype.MixedOneRoom,
]);

export function generateCampaignReleaseReservoir(
  scanPlan: readonly CampaignReleaseScanPlanEntry[] = CAMPAIGN_RELEASE_SCAN_PLAN,
  masterSeed = CAMPAIGN_RELEASE_MASTER_SEED,
): CampaignReleaseReservoirReport {
  if (!Number.isInteger(masterSeed) || masterSeed < 0 || masterSeed > 0xffff_ffff) {
    throw new RangeError('Campaign release masterSeed must be a uint32.');
  }

  const accepted: AcceptedCandidate[] = [];
  const stats: CampaignReleaseScanStats[] = [];
  const seenCandidateIds = new Set<string>();

  for (const entry of scanPlan) {
    validateScanPlanEntry(entry);

    let generated = 0;
    let generationFailed = 0;
    let duplicateRejected = 0;
    let monsterDensityRejected = 0;
    const evaluationRejected = {
      invalid: 0,
      'non-unique': 0,
      'hard-quality': 0,
      'geometry-warning': 0,
    } satisfies Record<Exclude<CandidateStatus, 'accepted'>, number>;
    let acceptedCount = 0;

    for (let attempt = 0; attempt < entry.attempts; attempt += 1) {
      const seed = deriveCandidateSeed(
        masterSeed,
        `release-${entry.archetype}-${entry.size}`,
        attempt,
      );
      const generation = generateCandidate({
        archetype: entry.archetype,
        size: entry.size,
        seed,
      });

      if (!generation.ok) {
        generationFailed += 1;
        continue;
      }
      generated += 1;

      const candidate = generation.candidate;
      if (seenCandidateIds.has(candidate.id)) {
        duplicateRejected += 1;
        continue;
      }
      seenCandidateIds.add(candidate.id);

      if (getGeneratorMonsterPolicy(candidate).reject) {
        monsterDensityRejected += 1;
        continue;
      }

      const evaluation = evaluateCandidate(candidate);
      if (evaluation.status !== 'accepted') {
        evaluationRejected[evaluation.status] += 1;
        continue;
      }

      accepted.push(evaluation.accepted);
      acceptedCount += 1;
    }

    stats.push({
      archetype: entry.archetype,
      size: entry.size,
      attempts: entry.attempts,
      generated,
      accepted: acceptedCount,
      generationFailed,
      duplicateRejected,
      monsterDensityRejected,
      evaluationRejected,
    });
  }

  return {
    masterSeed,
    accepted: accepted.sort(compareAcceptedIdentity),
    stats,
  };
}

function validateScanPlanEntry(entry: CampaignReleaseScanPlanEntry): void {
  if (!V1_CAMPAIGN_ARCHETYPES.has(entry.archetype)) {
    throw new Error(`Campaign release reservoir does not scan ${entry.archetype}.`);
  }
  if (entry.size !== 7) {
    throw new Error(`Campaign v1 release reservoir is fixed to 7x7 scans; got ${entry.size}.`);
  }
  if (!Number.isInteger(entry.attempts) || entry.attempts <= 0) {
    throw new RangeError('Campaign release scan attempts must be a positive integer.');
  }
}

function compareAcceptedIdentity(left: AcceptedCandidate, right: AcceptedCandidate): number {
  if (left.candidate.id < right.candidate.id) return -1;
  if (left.candidate.id > right.candidate.id) return 1;
  return left.candidate.seed - right.candidate.seed;
}

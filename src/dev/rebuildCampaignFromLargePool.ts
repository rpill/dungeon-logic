import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  decodeEndlessCatalog,
  type EndlessCatalogManifest,
} from '../content/endless/CatalogFormat';
import {
  CAMPAIGN_RELEASE_TARGET_SCORES,
  campaignReleaseStructuralFingerprint,
} from '../content/release/CampaignReleaseSelection';
import {
  selectCampaignCatalogSlots,
  type CampaignCatalogCandidate,
} from '../content/release/CampaignCatalogSelection';
import { buildCrossPoolFingerprints } from './endless/CrossPoolFingerprints';
import { deriveEndlessCandidateSeed } from './endless/ScanPlan';
import { generateCandidate } from '../puzzle/generator/CandidateGenerator';
import { getGeneratorMonsterPolicy, evaluateCandidate } from '../puzzle/generator/CandidateFactory';
import { analyzeLevelQuality } from '../puzzle/quality/LevelQualityAnalyzer';
import { analyzeHumanSolvability } from '../puzzle/human-solver/HumanSolver';
import { analyzeDifficulty } from '../puzzle/difficulty/DifficultyAnalyzer';
import { promotedCampaignLevels } from '../content/campaign/levels';
import { analyzeCampaignPromotion, renderCampaignLevelModule } from './CampaignPromotion';
import type { PromotedCampaignLevelSource } from '../content/campaign/types';

const ENDLESS_MASTER_SEED = 20260913;
const LEVELS_DIR = resolve('src', 'content', 'campaign', 'levels');
const MANIFEST_PATH = resolve('public', 'content', 'endless', 'verified-levels-manifest.json');
const BINARY_PATH = resolve('public', 'content', 'endless', 'verified-levels.bin');

const EXTRA_ATTEMPTS: Readonly<Record<string, number>> = {
  'monster-only:6': 1_500,
  'monster-only:7': 2_500,
  'monster-only:8': 3_000,
  'chest-one-room:7': 1_500,
  'chest-one-room:8': 1_500,
  'mixed-one-room:6': 4_000,
  'mixed-one-room:7': 3_500,
  'mixed-one-room:8': 5_000,
};

const TARGET_SCORES = new Set(Object.values(CAMPAIGN_RELEASE_TARGET_SCORES));
const INTERESTING_SCORES = new Set<number>();
for (const score of TARGET_SCORES) {
  INTERESTING_SCORES.add(score);
  INTERESTING_SCORES.add(score - 1);
  INTERESTING_SCORES.add(score + 1);
}

function main(): void {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as EndlessCatalogManifest;
  const catalog = decodeEndlessCatalog(readFileSync(BINARY_PATH), manifest);
  const crossPool = buildCrossPoolFingerprints();
  const excludedFingerprints = new Set<string>([...crossPool.campaign, ...crossPool.daily]);
  const excludedIds = new Set<string>(
    catalog.map((entry) => `generated-${entry.archetype}-${entry.size}-${entry.seed}`),
  );
  console.info(`[Campaign rebuild] loaded ${catalog.length} Endless production candidate ids; fresh scans begin after their lane ranges.`);

  const reservoir: CampaignCatalogCandidate[] = [];
  const seenFingerprints = new Set(excludedFingerprints);
  const seenIds = new Set(excludedIds);
  let attempts = 0;
  let generatedCount = 0;
  let targetMatched = 0;

  for (const sourceLane of manifest.sourceScanPlan) {
    const extraAttempts = EXTRA_ATTEMPTS[sourceLane.laneId] ?? 0;
    if (extraAttempts === 0) continue;
    const startAttempt = sourceLane.startAttempt + sourceLane.attemptCount;
    const lane = {
      index: 0,
      id: sourceLane.laneId,
      archetype: sourceLane.archetype,
      size: sourceLane.size,
      startAttempt,
      attemptCount: extraAttempts,
    };
    console.info(`[Campaign rebuild] scanning ${lane.id} attempts ${startAttempt}..${startAttempt + extraAttempts - 1}`);
    const laneAcceptedByScore = new Map<number, number>();

    for (let offset = 0; offset < extraAttempts; offset += 1) {
      attempts += 1;
      const attempt = startAttempt + offset;
      const seed = deriveEndlessCandidateSeed(ENDLESS_MASTER_SEED, lane, attempt);
      const generated = generateCandidate({ archetype: lane.archetype, size: lane.size, seed });
      if (!generated.ok) continue;
      generatedCount += 1;
      const candidate = generated.candidate;
      if (seenIds.has(candidate.id) || getGeneratorMonsterPolicy(candidate).reject) continue;

      const quality = analyzeLevelQuality(candidate.level);
      if (!quality.passes || quality.warnings.length > 0) continue;

      const human = analyzeHumanSolvability(candidate.level);
      const difficulty = analyzeDifficulty(candidate.level, human);
      if (difficulty.score === null || difficulty.band === 'unrated') continue;
      if (!INTERESTING_SCORES.has(difficulty.score)) continue;
      if (difficulty.band !== 'easy' && difficulty.band !== 'medium' && difficulty.band !== 'hard') continue;
      targetMatched += 1;
      if ((laneAcceptedByScore.get(difficulty.score) ?? 0) >= 16) continue;

      const evaluation = evaluateCandidate(candidate);
      if (evaluation.status !== 'accepted') continue;
      if (evaluation.accepted.difficulty.score !== difficulty.score || evaluation.accepted.difficulty.band !== difficulty.band) {
        throw new Error(`Difficulty drift while curating ${candidate.id}.`);
      }

      const fingerprint = campaignReleaseStructuralFingerprint(candidate.level.solution);
      if (seenFingerprints.has(fingerprint)) continue;
      seenIds.add(candidate.id);
      seenFingerprints.add(fingerprint);
      laneAcceptedByScore.set(difficulty.score, (laneAcceptedByScore.get(difficulty.score) ?? 0) + 1);
      reservoir.push({ accepted: evaluation.accepted, humanRuleCounts: human.ruleCounts });
    }
  }

  console.info(`[Campaign rebuild] attempts=${attempts} generated=${generatedCount} targetMatched=${targetMatched} curated=${reservoir.length}`);
  const selected = selectCampaignCatalogSlots(reservoir);

  const registry: PromotedCampaignLevelSource[] = promotedCampaignLevels.filter((entry) => entry.slot <= 7).map((entry) => ({ ...entry }));
  for (const entry of selected) {
    const candidate = entry.candidate.accepted.candidate;
    const analysis = analyzeCampaignPromotion(candidate, entry.slot, registry, true);
    const source: PromotedCampaignLevelSource = {
      slot: entry.slot,
      level: analysis.level,
      provenance: {
        sourceSeed: candidate.seed,
        sourceCandidateId: candidate.id,
        sourceArchetype: candidate.archetype,
        difficulty: analysis.difficulty,
        difficultyScore: analysis.difficultyScore,
        humanStatus: analysis.humanStatus,
      },
    };
    registry.push(source);
    registry.sort((a, b) => a.slot - b.slot);
    const modulePath = resolve(LEVELS_DIR, `campaign${String(entry.slot).padStart(3, '0')}.ts`);
    writeFileSync(modulePath, renderCampaignLevelModule(source.level, source.provenance), 'utf8');
    console.info(
      `[Campaign rebuild] ${String(entry.slot).padStart(2, '0')} target=${entry.targetScore} actual=${analysis.difficultyScore} size=${candidate.size} archetype=${candidate.archetype} interest=${entry.interestScore.toFixed(2)}`,
    );
  }
}

main();

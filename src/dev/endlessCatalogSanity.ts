import assert from 'node:assert/strict';
import {
  createHash,
} from 'node:crypto';

import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import {
  tmpdir,
} from 'node:os';
import {
  join,
} from 'node:path';
import {
  readGenerationState,
  readReservoirChunks,
  writeGenerationState,
  writeReservoirChunk,
} from './endless/ReservoirStore';
import {
  readEndlessSelection,
  readEndlessVerification,
  writeEndlessSelection,
  writeEndlessVerification,
} from './endless/PipelineArtifacts';
import {
  runEndlessGeneration,
} from './endless/Generation';
import {
  selectEndlessCatalog,
} from './endless/Selector';
import {
  verifyEndlessSelection,
} from './endless/Verifier';
import {
  packEndlessCatalog,
} from './endless/Packer';
import {
  createEndlessCatalog,
} from '../content/endless/EndlessCatalog';
import type {
  EndlessReservoirEntry,
} from './endless/types';

import {
  decodeEndlessCatalog,
  encodeEndlessCatalog,
  ENDLESS_CATALOG_VERSION,
  ENDLESS_RECORD_SIZE,
  ENDLESS_TARGET_COUNT,
  isEndlessCatalogManifest,
  type EndlessCatalogEntry,
  type EndlessCatalogManifest,
} from '../content/endless/CatalogFormat';
import {
  getEndlessCatalogSelectionTarget,
} from '../content/endless/ProgressionPolicy';
import {
  DifficultyBand,
} from '../puzzle/difficulty/types';
import {
  GeneratorArchetype,
} from '../puzzle/generator/types';
import {
  CandidateStatus,
} from '../puzzle/generator/types';
import {
  generateCandidate,
} from '../puzzle/generator/CandidateGenerator';
import {
  evaluateCandidate,
} from '../puzzle/generator/CandidateFactory';
import {
  candidateDistance,
  candidateDiversityDistance,
  createCandidateDiversitySignature,
} from '../puzzle/generator/CandidateRanker';

import {
  buildCrossPoolFingerprints,
} from './endless/CrossPoolFingerprints';
import {
  buildEndlessScanPlan,
  deriveEndlessCandidateSeed,
} from './endless/ScanPlan';

import {
  scanEndlessLane,
} from './endless/ReservoirScanner';
import {
  runEndlessProbe,
} from './endless/Probe';
import {
  buildEndlessBandDiversitySnapshot,
  buildEndlessCoveragePlan,
  buildEndlessReservoirTargets,
  calculateEndlessReservoirCoverage,
  chooseNextAdaptiveLane,
  createEmptyEndlessBandCounts,
  reservoirCoverageSatisfied,
} from './endless/AdaptiveScanPolicy';
import {
  readAdaptiveGenerationState,
  runAdaptiveEndlessGeneration,
} from './endless/AdaptiveGeneration';
import {
  runEndlessCli,
} from './endless/cli';
import {
  promotedCampaignLevels,
} from '../content/campaign/levels';
import {
  DAILY_RELEASE_ENTRIES,
} from '../content/daily/manifest';

const fixture: readonly EndlessCatalogEntry[] = [
  {
    seed: 123,
    archetype: GeneratorArchetype.MonsterOnly,
    size: 6,
    difficultyScore: 12,
    difficultyBand: DifficultyBand.Easy,
  },
  {
    seed: 0xffff_fffe,
    archetype: GeneratorArchetype.MixedTwoRooms,
    size: 8,
    difficultyScore: 88,
    difficultyBand: DifficultyBand.Expert,
  },
];

const manifest: EndlessCatalogManifest = {
  catalogVersion: 1,
  recordSize: 8,
  entryCount: 2,
  catalogTargetCount: 2,
  generatorVersion: 1,
  difficultyModelVersion: 1,
  solverSourceHash: 'a'.repeat(64),
  generatorSourceHash: 'b'.repeat(64),
  gameRulesSourceHash: 'c'.repeat(64),
  campaignContentHash: 'd'.repeat(64),
  dailyContentHash: 'e'.repeat(64),
  sourceScanPlan: [],
  verifiedCount: 2,
  rejectedVerificationCount: 0,
  duplicateCount: 0,
  campaignCollisionCount: 0,
  dailyCollisionCount: 0,
  countsByBand: {
    easy: 1,
    medium: 0,
    hard: 0,
    expert: 1,
  },
  countsByArchetype: {
    'monster-only': 1,
    'chest-one-room': 0,
    'chest-two-rooms': 0,
    'mixed-one-room': 0,
    'mixed-two-rooms': 1,
  },
  countsBySize: {
    '6': 1,
    '7': 0,
    '8': 1,
  },
  scoreHistogram: Array.from(
    { length: 101 },
    (_, score) =>
      score === 12 || score === 88
        ? 1
        : 0,
  ),
  productionAssetHash: 'f'.repeat(64),
};

const bytes = encodeEndlessCatalog(fixture);
assert.equal(
  bytes.byteLength,
  fixture.length * ENDLESS_RECORD_SIZE,
);
assert.deepEqual(
  decodeEndlessCatalog(bytes, manifest),
  fixture,
);
assert.equal(ENDLESS_CATALOG_VERSION, 1);

assert.ok(
  getEndlessCatalogSelectionTarget(1).targetScore <
    getEndlessCatalogSelectionTarget(20).targetScore,
);
assert.deepEqual(getEndlessCatalogSelectionTarget(1).allowedSizes, [6]);
assert.deepEqual(getEndlessCatalogSelectionTarget(29).allowedSizes, [6]);
assert.deepEqual(getEndlessCatalogSelectionTarget(30).allowedSizes, [8]);
assert.deepEqual(getEndlessCatalogSelectionTarget(60).allowedSizes, [8]);
assert.deepEqual(getEndlessCatalogSelectionTarget(60).allowedBands, [DifficultyBand.Easy]);
assert.deepEqual(getEndlessCatalogSelectionTarget(61).allowedBands, [DifficultyBand.Medium]);
assert.ok(
  getEndlessCatalogSelectionTarget(300).allowedBands.includes(
    DifficultyBand.Hard,
  ),
);
assert.ok(
  getEndlessCatalogSelectionTarget(500).allowedBands.includes(
    DifficultyBand.Expert,
  ),
);

for (
  let ordinal = 501;
  ordinal <= 2_000;
  ordinal += 1
) {
  const target =
    getEndlessCatalogSelectionTarget(ordinal);
  assert.ok(
    target.targetScore >= 45 &&
      target.targetScore <= 92,
  );
}

const forcedExpertOrdinals = Array.from(
  { length: 1_500 },
  (_, index) => index + 501,
).filter((ordinal) => {
  const target = getEndlessCatalogSelectionTarget(ordinal);
  return (
    target.allowedBands.length === 1 &&
    target.allowedBands[0] === DifficultyBand.Expert
  );
});
assert.ok(
  forcedExpertOrdinals.length >= 50,
  'Long-run progression must reserve deterministic Expert-only peaks.',
);

assert.throws(
  () => getEndlessCatalogSelectionTarget(0),
  RangeError,
);
assert.throws(
  () =>
    decodeEndlessCatalog(
      bytes.subarray(0, bytes.length - 1),
      manifest,
    ),
  /byte length/i,
);
assert.throws(
  () =>
    decodeEndlessCatalog(bytes, {
      ...manifest,
      catalogVersion: 2 as 1,
    }),
  /catalog version/i,
);

const invalidBand = bytes.slice();
invalidBand[7] = 4;
assert.throws(
  () =>
    decodeEndlessCatalog(
      invalidBand,
      manifest,
    ),
  /difficulty band code/i,
);

const invalidArchetype = bytes.slice();
invalidArchetype[4] = 9;
assert.throws(
  () =>
    decodeEndlessCatalog(
      invalidArchetype,
      manifest,
    ),
  /archetype code/i,
);

const invalidSize = bytes.slice();
invalidSize[5] = 9;
assert.throws(
  () =>
    decodeEndlessCatalog(
      invalidSize,
      manifest,
    ),
  /board size/i,
);

const invalidScore = bytes.slice();
invalidScore[6] = 101;
assert.throws(
  () =>
    decodeEndlessCatalog(
      invalidScore,
      manifest,
    ),
  /difficulty score/i,
);


const crossPool = buildCrossPoolFingerprints();
assert.equal(
  crossPool.campaign.size,
  promotedCampaignLevels.length,
);
assert.equal(
  crossPool.daily.size,
  DAILY_RELEASE_ENTRIES.length,
);

const scanPlanA = buildEndlessScanPlan(
  20260913,
  10,
);
const scanPlanB = buildEndlessScanPlan(
  20260913,
  10,
);
assert.deepEqual(scanPlanA, scanPlanB);
assert.ok(scanPlanA.length > 0);
assert.equal(
  new Set(scanPlanA.map((lane) => lane.id)).size,
  scanPlanA.length,
);
assert.equal(
  deriveEndlessCandidateSeed(
    20260913,
    scanPlanA[0],
    7,
  ),
  deriveEndlessCandidateSeed(
    20260913,
    scanPlanA[0],
    7,
  ),
);
assert.notEqual(
  deriveEndlessCandidateSeed(
    20260913,
    scanPlanA[0],
    7,
  ),
  deriveEndlessCandidateSeed(
    20260913,
    scanPlanA[1],
    7,
  ),
);


const tinyLane = scanPlanA[0];
const tinyScan = scanEndlessLane({
  masterSeed: 20260913,
  lane: {
    ...tinyLane,
    startAttempt: 0,
    attemptCount: 30,
  },
  crossPool,
  seenCandidateIds: new Set<string>(),
  seenStructuralFingerprints: new Set<string>(),
});
assert.equal(tinyScan.attempts, 30);
const tinyRejected = Object.values(
  tinyScan.rejectionCounts,
).reduce((sum, value) => sum + value, 0);
assert.equal(
  tinyRejected + tinyScan.accepted.length,
  30,
);
for (const entry of tinyScan.accepted) {
  assert.ok(
    entry.difficultyScore >= 0 &&
      entry.difficultyScore <= 100,
  );
  assert.notEqual(
    entry.difficultyBand,
    DifficultyBand.Unrated,
  );
  assert.ok(
    !crossPool.campaign.has(
      entry.structuralFingerprint,
    ),
  );
  assert.ok(
    !crossPool.daily.has(
      entry.structuralFingerprint,
    ),
  );
}


const tinyProbe = runEndlessProbe({
  masterSeed: 20260913,
  attemptsPerLane: 2,
  target: 20,
  reservePercent: 15,
});
assert.equal(
  tinyProbe.attempts,
  tinyProbe.laneCount * 2,
);
assert.equal(
  tinyProbe.accepted + Object.values(tinyProbe.rejectionCounts).reduce((sum, value) => sum + value, 0),
  tinyProbe.attempts,
);
assert.deepEqual(
  tinyProbe.progressionDemand,
  {
    easy: 20,
    medium: 0,
    hard: 0,
    expert: 0,
  },
);
assert.deepEqual(
  tinyProbe.reservoirTargets,
  {
    easy: 23,
    medium: 0,
    hard: 0,
    expert: 0,
  },
);
assert.equal(
  tinyProbe.lanes.length,
  tinyProbe.laneCount,
);
assert.equal(
  tinyProbe.lanes.reduce(
    (sum, lane) => sum + lane.attempts,
    0,
  ),
  tinyProbe.attempts,
);
assert.match(
  runEndlessCli([
    'probe',
    '--attempts-per-lane',
    '0',
    '--target',
    '20',
    '--reserve-percent',
    '15',
  ]),
  /reservoirTargets\(\+15%\)=\{"easy":23,"medium":0,"hard":0,"expert":0\}/,
);

const productionReservoirTargets =
  buildEndlessReservoirTargets(
    ENDLESS_TARGET_COUNT,
    15,
  );
assert.equal(
  Object.values(
    productionReservoirTargets.demand,
  ).reduce((sum, value) => sum + value, 0),
  ENDLESS_TARGET_COUNT,
);
assert.ok(
  productionReservoirTargets.targets.hard >
    productionReservoirTargets.demand.hard,
);
assert.ok(
  productionReservoirTargets.targets.expert >
    productionReservoirTargets.demand.expert,
);
assert.ok(
  productionReservoirTargets.targets.hard >
    productionReservoirTargets.targets.medium,
);

const productionCoveragePlan = buildEndlessCoveragePlan(
  ENDLESS_TARGET_COUNT,
  0,
);
assert.equal(
  productionCoveragePlan.totalTarget,
  ENDLESS_TARGET_COUNT,
);
assert.deepEqual(
  Object.fromEntries(
    productionCoveragePlan.buckets.map((bucket) => [
      bucket.allowedBands.join('|'),
      bucket.count,
    ]),
  ),
  {
    easy: 60,
    medium: 90,
    'medium|hard': 24_875,
    hard: 47_826,
    'hard|expert': 23_001,
    expert: 4_148,
  },
  'Coverage demand must follow progression allowedBands rather than targetScore bands.',
);

const resumedCoverageCounts = {
  easy: 60,
  medium: 2_484,
  hard: 70_791,
  expert: 20_099,
} as const;
assert.equal(
  calculateEndlessReservoirCoverage(
    resumedCoverageCounts,
    productionCoveragePlan,
  ),
  93_434,
  'Existing flexible-band candidates must count toward coverage instead of being discarded as score-band oversupply.',
);
assert.equal(
  reservoirCoverageSatisfied(
    resumedCoverageCounts,
    productionCoveragePlan,
  ),
  false,
);
assert.equal(
  calculateEndlessReservoirCoverage(
    {
      ...resumedCoverageCounts,
      hard: resumedCoverageCounts.hard + 6_566,
    },
    productionCoveragePlan,
  ),
  ENDLESS_TARGET_COUNT,
  'Hard candidates must be able to satisfy Hard|Expert slots after Hard-only demand is covered.',
);
assert.equal(
  reservoirCoverageSatisfied(
    {
      ...resumedCoverageCounts,
      hard: resumedCoverageCounts.hard + 6_566,
    },
    productionCoveragePlan,
  ),
  true,
);

const adaptivePlan = buildEndlessScanPlan(
  20260913,
  1_000,
);
const adaptiveLaneA = adaptivePlan.find(
  (lane) => lane.id === 'monster-only:6',
);
const adaptiveLaneB = adaptivePlan.find(
  (lane) => lane.id === 'monster-only:8',
);
assert.ok(adaptiveLaneA !== undefined);
assert.ok(adaptiveLaneB !== undefined);
if (adaptiveLaneB !== undefined) {
  const expertFocusedLane = adaptivePlan.find(
    (lane) => lane.id === 'chest-one-room:8',
  );
  assert.ok(expertFocusedLane !== undefined);
  if (expertFocusedLane !== undefined) {
    const coveragePick = chooseNextAdaptiveLane({
      lanes: [adaptiveLaneB, expertFocusedLane],
      attemptsByLane: {
        [adaptiveLaneB.id]: 100_000,
        [expertFocusedLane.id]: 100_000,
      },
      acceptedByLane: {
        [adaptiveLaneB.id]: {
          easy: 0,
          medium: 0,
          hard: 7_000,
          expert: 1_400,
        },
        [expertFocusedLane.id]: {
          easy: 0,
          medium: 0,
          hard: 0,
          expert: 5_000,
        },
      },
      counts: resumedCoverageCounts,
      coveragePlan: productionCoveragePlan,
      warmupAttemptsPerLane: 0,
      maxAttemptsPerLane: 1_000_000,
    });
    assert.equal(
      coveragePick?.id,
      adaptiveLaneB.id,
      'Coverage-aware scheduling must value Hard yield while Hard can satisfy flexible Hard|Expert slots.',
    );
  }

  const diversitySnapshot = buildEndlessBandDiversitySnapshot(
    [adaptiveLaneB],
    {
      [adaptiveLaneB.id]: {
        easy: 0,
        medium: 0,
        hard: 12,
        expert: 3,
      },
    },
    'hard',
  );
  assert.equal(
    diversitySnapshot.byLane[adaptiveLaneB.id],
    12,
    'Adaptive generation must keep diversity telemetry even though diversity no longer drives lane scheduling.',
  );
}
if (
  adaptiveLaneA !== undefined &&
  adaptiveLaneB !== undefined
) {
  const targets = {
    easy: 0,
    medium: 0,
    hard: 100,
    expert: 100,
  } as const;
  const counts = createEmptyEndlessBandCounts();
  const warmupPick = chooseNextAdaptiveLane({
    lanes: [adaptiveLaneA, adaptiveLaneB],
    attemptsByLane: {
      [adaptiveLaneA.id]: 10,
      [adaptiveLaneB.id]: 100,
    },
    acceptedByLane: {
      [adaptiveLaneA.id]: {
        easy: 8,
        medium: 2,
        hard: 0,
        expert: 0,
      },
      [adaptiveLaneB.id]: {
        easy: 20,
        medium: 10,
        hard: 20,
        expert: 8,
      },
    },
    counts,
    targets,
    warmupAttemptsPerLane: 100,
    maxAttemptsPerLane: 1_000,
  });
  assert.equal(
    warmupPick?.id,
    adaptiveLaneA.id,
    'Adaptive scan must finish deterministic lane warmup before yield-based scheduling.',
  );

  const yieldPick = chooseNextAdaptiveLane({
    lanes: [adaptiveLaneA, adaptiveLaneB],
    attemptsByLane: {
      [adaptiveLaneA.id]: 100,
      [adaptiveLaneB.id]: 100,
    },
    acceptedByLane: {
      [adaptiveLaneA.id]: {
        easy: 80,
        medium: 20,
        hard: 0,
        expert: 0,
      },
      [adaptiveLaneB.id]: {
        easy: 20,
        medium: 10,
        hard: 20,
        expert: 8,
      },
    },
    counts,
    targets,
    warmupAttemptsPerLane: 100,
    maxAttemptsPerLane: 1_000,
  });
  assert.equal(
    yieldPick?.id,
    adaptiveLaneB.id,
    'Adaptive scan must prefer the lane empirically yielding the missing hard/expert bands.',
  );

  const diversityLane = adaptivePlan.find(
    (lane) => lane.id === 'mixed-one-room:7',
  );
  assert.ok(diversityLane !== undefined);
  if (diversityLane !== undefined) {
    const diversityPick = chooseNextAdaptiveLane({
      lanes: [adaptiveLaneB, diversityLane],
      attemptsByLane: {
        [adaptiveLaneB.id]: 85_000,
        [diversityLane.id]: 1_000,
      },
      acceptedByLane: {
        [adaptiveLaneB.id]: {
          easy: 29,
          medium: 2_484,
          hard: 5_407,
          expert: 1_557,
        },
        [diversityLane.id]: {
          easy: 0,
          medium: 0,
          hard: 24,
          expert: 8,
        },
      },
      counts: {
        easy: 29,
        medium: 2_484,
        hard: 5_431,
        expert: 1_565,
      },
      targets: {
        easy: 29,
        medium: 2_484,
        hard: 81_410,
        expert: 31_078,
      },
      warmupAttemptsPerLane: 1_000,
      maxAttemptsPerLane: 3_000_000,
    });
    assert.equal(
      diversityPick?.id,
      adaptiveLaneB.id,
      'Adaptive scan must keep prioritizing missing-band yield even when the highest-yield lane is already heavily represented.',
    );

    const monsterSevenLane = adaptivePlan.find(
      (lane) => lane.id === 'monster-only:7',
    );
    assert.ok(monsterSevenLane !== undefined);
    if (monsterSevenLane !== undefined) {
      const resumedDiversityPick = chooseNextAdaptiveLane({
        lanes: [adaptiveLaneB, monsterSevenLane, diversityLane],
        attemptsByLane: {
          [adaptiveLaneB.id]: 85_000,
          [monsterSevenLane.id]: 75_000,
          [diversityLane.id]: 1_000,
        },
        acceptedByLane: {
          [adaptiveLaneB.id]: {
            easy: 29,
            medium: 2_484,
            hard: 5_407,
            expert: 1_557,
          },
          [monsterSevenLane.id]: {
            easy: 0,
            medium: 0,
            hard: 2_611,
            expert: 217,
          },
          [diversityLane.id]: {
            easy: 0,
            medium: 0,
            hard: 24,
            expert: 8,
          },
        },
        counts: {
          easy: 29,
          medium: 2_484,
          hard: 8_042,
          expert: 1_782,
        },
        targets: {
          easy: 29,
          medium: 2_484,
          hard: 81_410,
          expert: 31_078,
        },
        warmupAttemptsPerLane: 1_000,
        maxAttemptsPerLane: 3_000_000,
      });
      assert.equal(
        resumedDiversityPick?.id,
        adaptiveLaneB.id,
        'Adaptive scan must not spend resumed generation time balancing reservoir archetypes when monster-only:8 has the best missing-band yield.',
      );

      const productiveMixedLane = adaptivePlan.find(
        (lane) => lane.id === 'mixed-one-room:8',
      );
      const mixedTwoEightLane = adaptivePlan.find(
        (lane) => lane.id === 'mixed-two-rooms:8',
      );
      const chestOneSevenLane = adaptivePlan.find(
        (lane) => lane.id === 'chest-one-room:7',
      );
      assert.ok(productiveMixedLane !== undefined);
      assert.ok(mixedTwoEightLane !== undefined);
      assert.ok(chestOneSevenLane !== undefined);
      if (
        productiveMixedLane !== undefined &&
        mixedTwoEightLane !== undefined &&
        chestOneSevenLane !== undefined
      ) {
        const yieldAwarePick = chooseNextAdaptiveLane({
          lanes: [
            adaptiveLaneB,
            monsterSevenLane,
            diversityLane,
            productiveMixedLane,
            mixedTwoEightLane,
            chestOneSevenLane,
          ],
          attemptsByLane: {
            [adaptiveLaneB.id]: 85_000,
            [monsterSevenLane.id]: 75_000,
            [diversityLane.id]: 27_000,
            [productiveMixedLane.id]: 1_000,
            [mixedTwoEightLane.id]: 1_000,
            [chestOneSevenLane.id]: 5_000,
          },
          acceptedByLane: {
            [adaptiveLaneB.id]: {
              easy: 29,
              medium: 2_484,
              hard: 5_444,
              expert: 1_552,
            },
            [monsterSevenLane.id]: {
              easy: 0,
              medium: 0,
              hard: 2_943,
              expert: 239,
            },
            [diversityLane.id]: {
              easy: 0,
              medium: 0,
              hard: 120,
              expert: 8,
            },
            [productiveMixedLane.id]: {
              easy: 0,
              medium: 0,
              hard: 26,
              expert: 5,
            },
            [mixedTwoEightLane.id]: {
              easy: 0,
              medium: 0,
              hard: 9,
              expert: 2,
            },
            [chestOneSevenLane.id]: {
              easy: 0,
              medium: 0,
              hard: 5,
              expert: 10,
            },
          },
          counts: {
            easy: 29,
            medium: 2_484,
            hard: 8_547,
            expert: 1_816,
          },
          targets: {
            easy: 29,
            medium: 2_484,
            hard: 81_410,
            expert: 31_078,
          },
          warmupAttemptsPerLane: 1_000,
          maxAttemptsPerLane: 3_000_000,
          recentLaneId: diversityLane.id,
          consecutiveLaneChunks: 3,
        });
        assert.equal(
          yieldAwarePick?.id,
          adaptiveLaneB.id,
          'Adaptive scan must choose the strongest empirical missing-band yield regardless of archetype representation.',
        );
      }
    }

    const rotationLane = adaptivePlan.find(
      (lane) => lane.id === 'mixed-one-room:8',
    );
    assert.ok(rotationLane !== undefined);
    if (rotationLane !== undefined) {
      const rotationPick = chooseNextAdaptiveLane({
        lanes: [adaptiveLaneB, rotationLane],
        attemptsByLane: {
          [adaptiveLaneB.id]: 1_000,
          [rotationLane.id]: 1_000,
        },
        acceptedByLane: {
          [adaptiveLaneB.id]: {
            easy: 0,
            medium: 0,
            hard: 100,
            expert: 30,
          },
          [rotationLane.id]: {
            easy: 0,
            medium: 0,
            hard: 60,
            expert: 20,
          },
        },
        counts: {
          easy: 0,
          medium: 0,
          hard: 160,
          expert: 50,
        },
        targets: {
          easy: 0,
          medium: 0,
          hard: 1_000,
          expert: 1_000,
        },
        warmupAttemptsPerLane: 1_000,
        maxAttemptsPerLane: 3_000_000,
        recentLaneId: adaptiveLaneB.id,
        consecutiveLaneChunks: 3,
      });
      assert.equal(
        rotationPick?.id,
        adaptiveLaneB.id,
        'Adaptive scan must not force lane rotation when the current lane still has the strongest missing-band yield.',
      );
    }
  }
}

const adaptiveGenerationRoot = mkdtempSync(
  join(tmpdir(), 'dungeon-logic-endless-adaptive-'),
);
try {
  const interrupted = runAdaptiveEndlessGeneration({
    rootDir: adaptiveGenerationRoot,
    masterSeed: 20260913,
    targetCount: 20,
    reservePercent: 15,
    warmupAttemptsPerLane: 0,
    maxAttemptsPerLane: 500,
    chunkAttempts: 5,
    resume: false,
    stopAfterChunks: 1,
  });
  assert.equal(interrupted.completed, false);
  assert.equal(interrupted.chunksWritten, 1);
  const resumed = runAdaptiveEndlessGeneration({
    rootDir: adaptiveGenerationRoot,
    masterSeed: 20260913,
    targetCount: 20,
    reservePercent: 0,
    warmupAttemptsPerLane: 0,
    maxAttemptsPerLane: 500,
    chunkAttempts: 5,
    resume: true,
  });
  assert.equal(resumed.completed, true);
  assert.equal(resumed.reservoirCount, 20);
  assert.deepEqual(resumed.counts, {
    easy: 20,
    medium: 0,
    hard: 0,
    expert: 0,
  });
  assert.equal(
    readAdaptiveGenerationState(
      adaptiveGenerationRoot,
    )?.nextAttemptByLane !== undefined,
    true,
  );
} finally {
  rmSync(adaptiveGenerationRoot, {
    recursive: true,
    force: true,
  });
}



assert.ok(
  tinyScan.accepted.length >= 2,
  'Expected deterministic tiny Endless scan to yield at least two accepted candidates.',
);
const diversityAccepted = tinyScan.accepted.slice(0, 2).map((entry) => {
  const generated = generateCandidate({
    seed: entry.seed,
    archetype: entry.archetype,
    size: entry.size,
  });
  assert.equal(generated.ok, true);
  const evaluated = evaluateCandidate(generated.candidate);
  assert.equal(evaluated.status, CandidateStatus.Accepted);
  return evaluated.accepted;
});
assert.equal(
  candidateDiversityDistance(
    createCandidateDiversitySignature(diversityAccepted[0]),
    createCandidateDiversitySignature(diversityAccepted[1]),
  ),
  candidateDistance(
    diversityAccepted[0],
    diversityAccepted[1],
  ),
);

const persistenceRoot = mkdtempSync(
  join(tmpdir(), 'dungeon-logic-endless-store-'),
);
try {
  const persistedA = tinyScan.accepted[0];
  const persistedB = tinyScan.accepted[1];
  if (persistedA !== undefined && persistedB !== undefined) {
    writeReservoirChunk({
      rootDir: persistenceRoot,
      laneIndex: tinyLane.index,
      startAttempt: persistedB.attempt,
      endAttemptExclusive: persistedB.attempt + 1,
      entries: [persistedB],
    });
    writeReservoirChunk({
      rootDir: persistenceRoot,
      laneIndex: tinyLane.index,
      startAttempt: persistedA.attempt,
      endAttemptExclusive: persistedA.attempt + 1,
      entries: [persistedA],
    });
    const persisted = readReservoirChunks(persistenceRoot);
    assert.deepEqual(
      persisted,
      [persistedA, persistedB].sort(
        (left, right) =>
          left.laneIndex - right.laneIndex ||
          left.attempt - right.attempt ||
          left.candidateId.localeCompare(right.candidateId),
      ),
    );
  }

  const generationState = {
    version: 1 as const,
    masterSeed: 20260913,
    attemptsPerLane: 100,
    nextAttemptByLane: {
      [tinyLane.id]: 35,
    },
  };
  writeGenerationState(
    persistenceRoot,
    generationState,
  );
  assert.deepEqual(
    readGenerationState(persistenceRoot),
    generationState,
  );
} finally {
  rmSync(persistenceRoot, {
    recursive: true,
    force: true,
  });
}

const crashRecoveryRoot = mkdtempSync(
  join(tmpdir(), 'dungeon-logic-endless-crash-recovery-'),
);
try {
  const recoveryPlan = buildEndlessScanPlan(
    20260913,
    30,
  );
  writeReservoirChunk({
    rootDir: crashRecoveryRoot,
    laneIndex: tinyLane.index,
    startAttempt: 0,
    endAttemptExclusive: 30,
    entries: tinyScan.accepted,
  });
  writeGenerationState(
    crashRecoveryRoot,
    {
      version: 1,
      masterSeed: 20260913,
      attemptsPerLane: 30,
      nextAttemptByLane: Object.fromEntries(
        recoveryPlan.map((lane) => [lane.id, 0]),
      ),
    },
  );
  runEndlessGeneration({
    rootDir: crashRecoveryRoot,
    masterSeed: 20260913,
    attemptsPerLane: 30,
    chunkAttempts: 30,
    resume: true,
    stopAfterChunks: 0,
  });
  assert.equal(
    readGenerationState(crashRecoveryRoot)
      ?.nextAttemptByLane[tinyLane.id],
    30,
    'Resume must recover a chunk committed before generation-state.json was advanced.',
  );
} finally {
  rmSync(crashRecoveryRoot, {
    recursive: true,
    force: true,
  });
}

const realSelected = selectEndlessCatalog(
  tinyScan.accepted,
  2,
);
const realVerification = verifyEndlessSelection(
  realSelected,
  crossPool,
);
assert.equal(realVerification.ok, true);
assert.equal(realVerification.verifiedCount, 2);
assert.equal(
  realVerification.rejectedVerificationCount,
  0,
);

const badDifficultyVerification = verifyEndlessSelection(
  [
    {
      ...realSelected[0],
      difficultyScore:
        realSelected[0].difficultyScore + 1,
    },
  ],
  crossPool,
);
assert.equal(badDifficultyVerification.ok, false);
assert.ok(
  badDifficultyVerification.failures.some(
    (failure) =>
      failure.reason === 'difficulty-mismatch',
  ),
);

const badFingerprintVerification = verifyEndlessSelection(
  [
    {
      ...realSelected[0],
      structuralFingerprint: 'not-the-real-fingerprint',
    },
  ],
  crossPool,
);
assert.equal(badFingerprintVerification.ok, false);
assert.ok(
  badFingerprintVerification.failures.some(
    (failure) =>
      failure.reason === 'fingerprint-mismatch',
  ),
);

const duplicateVerification = verifyEndlessSelection(
  [
    realSelected[0],
    {
      ...realSelected[0],
      ordinal: 2,
    },
  ],
  crossPool,
);
assert.equal(duplicateVerification.ok, false);
assert.ok(duplicateVerification.duplicateCount > 0);

const artifactsRoot = mkdtempSync(
  join(tmpdir(), 'dungeon-logic-endless-artifacts-'),
);
try {
  const selectionPath = writeEndlessSelection(
    artifactsRoot,
    realSelected,
  );
  const persistedSelection = readEndlessSelection(
    artifactsRoot,
  );
  assert.equal(persistedSelection.length, 2);
  assert.equal(
    persistedSelection[0].candidateId,
    realSelected[0].candidateId,
  );
  writeEndlessVerification(
    artifactsRoot,
    realVerification,
  );
  assert.deepEqual(
    readEndlessVerification(artifactsRoot),
    realVerification,
  );

  const malformed = JSON.parse(
    readFileSync(selectionPath, 'utf8')
      .trim()
      .split(/\r?\n/)[0],
  ) as Record<string, unknown>;
  malformed.ordinal = 1.5;
  writeFileSync(
    selectionPath,
    `${JSON.stringify(malformed)}\n`,
    'utf8',
  );
  assert.throws(
    () => readEndlessSelection(artifactsRoot),
    /ordinal/i,
  );
} finally {
  rmSync(artifactsRoot, {
    recursive: true,
    force: true,
  });
}

const packRootA = mkdtempSync(
  join(tmpdir(), 'dungeon-logic-endless-pack-a-'),
);
const packRootB = mkdtempSync(
  join(tmpdir(), 'dungeon-logic-endless-pack-b-'),
);
try {
  const packOptions = {
    targetCount: 2,
    sourceScanPlan: [
      {
        laneId: tinyLane.id,
        archetype: tinyLane.archetype,
        size: tinyLane.size,
        startAttempt: 0,
        attemptCount: 30,
      },
    ],
    provenance: {
      generatorVersion: 1,
      difficultyModelVersion: 1,
      solverSourceHash: 'a'.repeat(64),
      generatorSourceHash: 'b'.repeat(64),
      gameRulesSourceHash: 'c'.repeat(64),
      campaignContentHash: 'd'.repeat(64),
      dailyContentHash: 'e'.repeat(64),
    },
  } as const;
  const packedA = packEndlessCatalog(
    realSelected,
    realVerification,
    {
      ...packOptions,
      outputDir: packRootA,
    },
  );
  const packedB = packEndlessCatalog(
    realSelected,
    realVerification,
    {
      ...packOptions,
      outputDir: packRootB,
    },
  );
  const binaryA = readFileSync(packedA.binaryPath);
  const binaryB = readFileSync(packedB.binaryPath);
  const manifestTextA = readFileSync(
    packedA.manifestPath,
    'utf8',
  );
  const manifestTextB = readFileSync(
    packedB.manifestPath,
    'utf8',
  );
  assert.deepEqual(binaryA, binaryB);
  assert.equal(manifestTextA, manifestTextB);
  assert.equal(binaryA.byteLength, 16);
  assert.equal(
    createHash('sha256').update(binaryA).digest('hex'),
    packedA.manifest.productionAssetHash,
  );

  const runtimeCatalog = createEndlessCatalog(
    new Uint8Array(binaryA),
    packedA.manifest,
  );
  assert.equal(runtimeCatalog.length, 2);
  assert.equal(
    runtimeCatalog.get(0).seed,
    realSelected[0].seed,
  );
  const runtimeGenerated = generateCandidate({
    seed: realSelected[0].seed,
    archetype: realSelected[0].archetype,
    size: realSelected[0].size,
  });
  assert.equal(runtimeGenerated.ok, true);
  assert.deepEqual(
    runtimeCatalog.createLevel(0),
    runtimeGenerated.candidate.level,
  );
  assert.throws(
    () => runtimeCatalog.get(-1),
    RangeError,
  );
  assert.throws(
    () => runtimeCatalog.get(2),
    RangeError,
  );
} finally {
  rmSync(packRootA, { recursive: true, force: true });
  rmSync(packRootB, { recursive: true, force: true });
}

const syntheticReservoir: EndlessReservoirEntry[] = Array.from(
  { length: 140 },
  (_, index) => {
    const easy = index < 80;
    const archetypes = [
      GeneratorArchetype.MonsterOnly,
      GeneratorArchetype.ChestOneRoom,
      GeneratorArchetype.MixedOneRoom,
    ] as const;
    const archetype = archetypes[index % archetypes.length];
    const size = easy
      ? (index < 40 ? 6 : 8)
      : 7;
    const difficultyScore = easy
      ? (size === 6 ? 4 + (index % 5) : 14 + (index % 7))
      : 30 + (index % 15);
    const solution = Array.from(
      { length: size },
      (_, y) => Array.from(
        { length: size },
        (_, x) => ((x + y + index) % 4 === 0 ? '#' : '.'),
      ).join(''),
    );
    return {
      laneIndex: index % 3,
      laneId: `${archetype}:${size}`,
      attempt: index,
      seed: index + 1,
      candidateId: `synthetic-${String(index).padStart(4, '0')}`,
      archetype,
      size,
      difficultyScore,
      difficultyBand: easy
        ? DifficultyBand.Easy
        : DifficultyBand.Medium,
      qualityScore: 80 + (index % 17),
      structuralFingerprint: `fp-${index}`,
      diversity: {
        size,
        wallDensity: 0.30 + (index % 10) / 100,
        thickWallCellRatio: 0.20 + (index % 7) / 100,
        wallOpenBoundaryPerWall: 1.4 + (index % 5) / 10,
        largestWallComponentRatio: 0.40 + (index % 8) / 100,
        monsterCount: index % 5,
        solution,
        rooms: [],
      },
    };
  },
);
const syntheticSelectedA = selectEndlessCatalog(
  syntheticReservoir,
  50,
);
const syntheticSelectedB = selectEndlessCatalog(
  [...syntheticReservoir].reverse(),
  50,
);
assert.deepEqual(
  syntheticSelectedA,
  syntheticSelectedB,
);
assert.equal(syntheticSelectedA.length, 50);
assert.equal(
  new Set(
    syntheticSelectedA.map(
      (entry) => entry.structuralFingerprint,
    ),
  ).size,
  50,
);
assert.ok(
  maxRun(
    syntheticSelectedA.map(
      (entry) => entry.archetype,
    ),
  ) <= 3,
);
assert.ok(syntheticSelectedA.slice(0, 29).every((entry) => entry.size === 6));
assert.ok(syntheticSelectedA.slice(29, 50).every((entry) => entry.size === 8));
for (const entry of syntheticSelectedA) {
  assert.ok(
    getEndlessCatalogSelectionTarget(entry.ordinal).allowedBands.includes(
      entry.difficultyBand,
    ),
  );
}

const scarcityReservoir: EndlessReservoirEntry[] = [];
const appendScarcityEntries = (
  band: EndlessReservoirEntry['difficultyBand'],
  count: number,
  difficultyScore: number,
  qualityScore: number,
  size: 6 | 7 | 8 = 8,
): void => {
  for (let index = 0; index < count; index += 1) {
    const id = `scarcity-${band}-${size}-${String(index).padStart(4, '0')}`;
    scarcityReservoir.push({
      laneIndex: 0,
      laneId: `monster-only:${size}`,
      attempt: scarcityReservoir.length,
      seed: 10_000 + scarcityReservoir.length,
      candidateId: id,
      archetype: GeneratorArchetype.MonsterOnly,
      size,
      difficultyScore,
      difficultyBand: band,
      qualityScore,
      structuralFingerprint: `scarcity-fp-${id}`,
      diversity: {
        size,
        wallDensity: 0.35,
        thickWallCellRatio: 0.25,
        wallOpenBoundaryPerWall: 1.5,
        largestWallComponentRatio: 0.45,
        monsterCount: 2,
        solution: Array.from({ length: size }, () => '.'.repeat(size)),
        rooms: [],
      },
    });
  }
};

// This reservoir has exactly enough material for the first 501 progression
// slots. After the 150 Hard-only campaign-ramp slots, one Hard entry must
// remain for ordinal 501; the flexible Hard|Expert phase should consume Expert instead.
appendScarcityEntries(DifficultyBand.Easy, 29, 6, 80, 6);
appendScarcityEntries(DifficultyBand.Easy, 31, 17, 80, 8);
appendScarcityEntries(DifficultyBand.Medium, 90, 36, 80, 7);
appendScarcityEntries(DifficultyBand.Hard, 151, 62, 200, 8);
appendScarcityEntries(DifficultyBand.Expert, 200, 82, 10, 8);

const scarcitySelected = selectEndlessCatalog(
  scarcityReservoir,
  501,
);
assert.equal(scarcitySelected.length, 501);
assert.equal(
  scarcitySelected[500].difficultyBand,
  DifficultyBand.Hard,
  'Selector must preserve scarce Hard candidates for future Hard-only progression slots.',
);

const generationExtendedFullRoot = mkdtempSync(
  join(tmpdir(), 'dungeon-logic-endless-extended-full-'),
);
const generationExtendedResumeRoot = mkdtempSync(
  join(tmpdir(), 'dungeon-logic-endless-extended-resume-'),
);
try {
  const fullExtended = runEndlessGeneration({
    rootDir: generationExtendedFullRoot,
    masterSeed: 20260913,
    attemptsPerLane: 3,
    chunkAttempts: 1,
    resume: false,
  });
  runEndlessGeneration({
    rootDir: generationExtendedResumeRoot,
    masterSeed: 20260913,
    attemptsPerLane: 2,
    chunkAttempts: 1,
    resume: false,
  });
  const resumedExtended = runEndlessGeneration({
    rootDir: generationExtendedResumeRoot,
    masterSeed: 20260913,
    attemptsPerLane: 3,
    chunkAttempts: 1,
    resume: true,
  });
  assert.deepEqual(
    resumedExtended.entries,
    fullExtended.entries,
    'Resume with a larger attempts-per-lane budget must extend the reservoir deterministically.',
  );
} finally {
  rmSync(generationExtendedFullRoot, {
    recursive: true,
    force: true,
  });
  rmSync(generationExtendedResumeRoot, {
    recursive: true,
    force: true,
  });
}

const generationFullRoot = mkdtempSync(
  join(tmpdir(), 'dungeon-logic-endless-full-'),
);
const generationResumeRoot = mkdtempSync(
  join(tmpdir(), 'dungeon-logic-endless-resume-'),
);
try {
  const fullGeneration = runEndlessGeneration({
    rootDir: generationFullRoot,
    masterSeed: 20260913,
    attemptsPerLane: 2,
    chunkAttempts: 1,
    resume: false,
  });
  assert.equal(fullGeneration.completed, true);

  const interrupted = runEndlessGeneration({
    rootDir: generationResumeRoot,
    masterSeed: 20260913,
    attemptsPerLane: 2,
    chunkAttempts: 1,
    resume: false,
    stopAfterChunks: 3,
  });
  assert.equal(interrupted.completed, false);

  const resumed = runEndlessGeneration({
    rootDir: generationResumeRoot,
    masterSeed: 20260913,
    attemptsPerLane: 2,
    chunkAttempts: 1,
    resume: true,
  });
  assert.equal(resumed.completed, true);
  assert.deepEqual(
    resumed.entries,
    fullGeneration.entries,
  );
} finally {
  rmSync(generationFullRoot, {
    recursive: true,
    force: true,
  });
  rmSync(generationResumeRoot, {
    recursive: true,
    force: true,
  });
}

const runtimeSourcePaths = [
  join(
    process.cwd(),
    'src/content/endless/EndlessCatalog.ts',
  ),
  join(
    process.cwd(),
    'src/content/endless/EndlessCatalogLoader.ts',
  ),
];
for (const runtimeSourcePath of runtimeSourcePaths) {
  const runtimeSource = readFileSync(
    runtimeSourcePath,
    'utf8',
  );
  for (const forbidden of [
    '/solver/',
    '/human-solver/',
    '/difficulty/',
    '/quality/',
  ]) {
    assert.equal(
      runtimeSource.includes(forbidden),
      false,
      `${runtimeSourcePath} must not import ${forbidden} at runtime.`,
    );
  }
}

runProductionCatalogGate();

function runProductionCatalogGate(): void {
  const allowMissing = process.argv.includes(
    '--allow-missing-production',
  );
  const productionDir = join(
    process.cwd(),
    'public/content/endless',
  );
  const binaryPath = join(
    productionDir,
    'verified-levels.bin',
  );
  const manifestPath = join(
    productionDir,
    'verified-levels-manifest.json',
  );
  const binaryExists = existsSync(binaryPath);
  const manifestExists = existsSync(manifestPath);

  if (!binaryExists && !manifestExists) {
    if (allowMissing) return;
    throw new Error(
      'Production Endless catalog is missing. Run with --allow-missing-production during development, or generate and pack the 100000-level production catalog.',
    );
  }
  assert.equal(
    binaryExists,
    true,
    'Production Endless binary is missing while manifest exists.',
  );
  assert.equal(
    manifestExists,
    true,
    'Production Endless manifest is missing while binary exists.',
  );

  const manifestValue: unknown = JSON.parse(
    readFileSync(manifestPath, 'utf8'),
  );
  assert.equal(
    isEndlessCatalogManifest(manifestValue),
    true,
    'Production Endless manifest header is invalid.',
  );
  if (!isEndlessCatalogManifest(manifestValue)) {
    throw new Error(
      'Production Endless manifest header is invalid.',
    );
  }
  const productionManifest = manifestValue;
  const productionBytes = readFileSync(binaryPath);

  assert.equal(
    productionManifest.entryCount,
    productionManifest.catalogTargetCount,
  );
  assert.equal(
    productionManifest.entryCount,
    ENDLESS_TARGET_COUNT,
  );
  assert.equal(
    productionBytes.byteLength,
    productionManifest.entryCount * ENDLESS_RECORD_SIZE,
  );
  assert.equal(
    productionManifest.verifiedCount,
    productionManifest.entryCount,
  );
  assert.equal(
    productionManifest.rejectedVerificationCount,
    0,
  );
  assert.equal(productionManifest.duplicateCount, 0);
  assert.equal(
    productionManifest.campaignCollisionCount,
    0,
  );
  assert.equal(
    productionManifest.dailyCollisionCount,
    0,
  );
  assert.equal(
    createHash('sha256')
      .update(productionBytes)
      .digest('hex'),
    productionManifest.productionAssetHash,
  );
  assert.equal(
    sumRecord(productionManifest.countsByBand),
    productionManifest.entryCount,
  );
  assert.equal(
    sumRecord(productionManifest.countsByArchetype),
    productionManifest.entryCount,
  );
  assert.equal(
    sumRecord(productionManifest.countsBySize),
    productionManifest.entryCount,
  );
  assert.equal(
    productionManifest.scoreHistogram.reduce(
      (sum, count) => sum + count,
      0,
    ),
    productionManifest.entryCount,
  );
  decodeEndlessCatalog(
    new Uint8Array(productionBytes),
    productionManifest,
  );
}

function sumRecord(
  values: Readonly<Record<string, number>>,
): number {
  return Object.values(values).reduce(
    (sum, value) => sum + value,
    0,
  );
}

function maxRun<T>(values: readonly T[]): number {
  let best = 0;
  let current = 0;
  let previous: T | undefined;
  for (const value of values) {
    if (value === previous) {
      current += 1;
    } else {
      previous = value;
      current = 1;
    }
    best = Math.max(best, current);
  }
  return best;
}

console.info(
  '[Dungeon Logic] Endless catalog sanity: format + progression + scan + probe + generation + selector + verifier + pack + runtime passed',
);

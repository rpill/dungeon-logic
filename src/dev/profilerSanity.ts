import {
  readFile,
} from 'node:fs/promises';

import {
  level001,
} from '../data/levels/level001';

import {
  DifficultyTarget,
} from '../puzzle/difficulty/types';

import {
  createCandidatePool,
  evaluateCandidate,
} from '../puzzle/generator/CandidateFactory';

import {
  CandidateStatus,
  GeneratorArchetype,
  RejectionReason,
  type GeneratedCandidate,
} from '../puzzle/generator/types';

import {
  formatGeneratorProfileReport,
  profileGeneratedCandidate,
  profileGeneratorRun,
  type GeneratorRunProfile,
} from './profileGenerator';

import {
  buildProfileGeneratorCliReport,
  parseProfileGeneratorCliArgs,
  parseProfileMasterSeed,
} from './profileGeneratorCli';

function assert(
  condition: boolean,
  message: string,
): void {
  if (!condition) {
    throw new Error(message);
  }
}

function runCandidateProfileChecks(): void {
  const candidate:
    GeneratedCandidate = {
    id: 'profile-level001',
    seed: 1,
    archetype:
      GeneratorArchetype.MonsterOnly,
    size: 6,
    rooms: [],
    level: level001,
  };

  const baseline =
    evaluateCandidate(candidate);

  const profiled =
    profileGeneratedCandidate(
      candidate,
    );

  assert(
    profiled.evaluation.status ===
      baseline.status,
    'Profiled candidate evaluation must preserve the normal evaluation status.',
  );

  assert(
    profiled.solverDiagnostics !== null,
    'A valid unique candidate must expose solver diagnostics.',
  );

  if (
    profiled.solverDiagnostics ===
    null
  ) {
    throw new Error(
      'Expected solver diagnostics.',
    );
  }

  assert(
    profiled.solverDiagnostics
      .nodesVisited > 0,
    'Candidate profile must expose visited solver nodes.',
  );

  assert(
    profiled.solverDiagnostics
      .completeCandidatesChecked >= 1,
    'Unique candidate profile must check at least one complete solver candidate.',
  );

  const timings = [
    profiled.timings.validationMs,
    profiled.timings.solverMs,
    profiled.timings.qualityMs,
    profiled.timings.humanDifficultyMs,
    profiled.timings.totalMs,
  ];

  assert(
    timings.every(
      (value) =>
        Number.isFinite(value) &&
        value >= 0,
    ),
    'Candidate profiling timings must be finite non-negative milliseconds.',
  );
}

function normalizeRunProfile(
  profile: GeneratorRunProfile,
): unknown {
  return {
    masterSeed:
      profile.masterSeed,
    config:
      profile.config,
    completed:
      profile.completed,
    acceptedCandidateIds:
      profile.acceptedCandidateIds,
    archetypes:
      profile.archetypes,
    attempts:
      profile.attempts.map(
        (attempt) => ({
          archetype:
            attempt.archetype,
          attempt:
            attempt.attempt,
          candidateSeed:
            attempt.candidateSeed,
          size:
            attempt.size,
          candidateId:
            attempt.candidateId,
          status:
            attempt.status,
          diagnostic:
            attempt.diagnostic,
          solverDiagnostics:
            attempt.solverDiagnostics,
        }),
      ),
  };
}

function runGeneratorRunProfileChecks(): void {
  const config = {
    masterSeed: 123456,
    acceptedPerArchetype: 1,
    shortlistPerArchetype: 1,
    maxAttemptsPerArchetype: 5000,
  } as const;

  const baseline =
    createCandidatePool(config);

  const profiled =
    profileGeneratorRun(config);

  const repeated =
    profileGeneratorRun(config);

  assert(
    JSON.stringify(
      normalizeRunProfile(
        profiled,
      ),
    ) ===
      JSON.stringify(
        normalizeRunProfile(
          repeated,
        ),
      ),
    'Profiled generator run must be deterministic after timing fields are removed.',
  );

  assert(
    profiled.completed ===
      baseline.completed,
    'Profiled generator run must preserve completed state.',
  );

  const baselineAcceptedIds =
    baseline.accepted.map(
      (accepted) =>
        accepted.candidate.id,
    );

  assert(
    JSON.stringify(
      profiled.acceptedCandidateIds,
    ) ===
      JSON.stringify(
        baselineAcceptedIds,
      ),
    'Profiled generator run must accept the same candidates in the same order.',
  );

  const expectedAttemptCount =
    baseline.archetypes.reduce(
      (sum, result) =>
        sum +
        result.stats.attempts,
      0,
    );

  assert(
    profiled.attempts.length ===
      expectedAttemptCount,
    'Profiled generator run must record every baseline attempt exactly once.',
  );

  for (
    const baselineArchetype
    of baseline.archetypes
  ) {
    const profiledArchetype =
      profiled.archetypes.find(
        (entry) =>
          entry.archetype ===
          baselineArchetype
            .stats.archetype,
      );

    assert(
      profiledArchetype !==
        undefined,
      `Profiled run must contain ${baselineArchetype.stats.archetype}.`,
    );

    if (
      profiledArchetype ===
      undefined
    ) {
      throw new Error(
        'Expected profiled archetype.',
      );
    }

    assert(
      profiledArchetype.attempts ===
        baselineArchetype
          .stats.attempts,
      `${baselineArchetype.stats.archetype} profiled attempts must match baseline.`,
    );

    assert(
      profiledArchetype.accepted ===
        baselineArchetype
          .stats.accepted,
      `${baselineArchetype.stats.archetype} profiled accepted count must match baseline.`,
    );
  }

  assert(
    profiled.attempts.every(
      (attempt) =>
        Number.isFinite(
          attempt.timings
            .generationMs,
        ) &&
        attempt.timings
          .generationMs >= 0 &&
        Number.isFinite(
          attempt.timings.totalMs,
        ) &&
        attempt.timings.totalMs >= 0,
    ),
    'Every generator attempt profile must expose finite non-negative generation and total timings.',
  );

  const acceptedAttempts =
    profiled.attempts.filter(
      (attempt) =>
        attempt.status ===
        'accepted',
    );

  assert(
    acceptedAttempts.length ===
      baseline.accepted.length,
    'Profiled run must record one accepted attempt per baseline accepted candidate.',
  );

  assert(
    acceptedAttempts.every(
      (attempt) =>
        attempt.solverDiagnostics !==
          null &&
        attempt.solverDiagnostics
          .nodesVisited > 0,
    ),
    'Accepted generator attempts must expose solver diagnostics.',
  );

  assert(
    profiled.attempts.every(
      (attempt) =>
        attempt.status ===
          CandidateStatus.Accepted ||
        attempt.timings
          .humanDifficultyMs === 0,
    ),
    'Rejected generator attempts must spend zero recorded Human Solver/Difficulty Analyzer time.',
  );

  assert(
    baseline.accepted.every(
      (accepted) =>
        accepted.difficulty.version === 1,
    ),
    'Baseline accepted candidates must carry Difficulty v1 profiles.',
  );
}

function findMonsterDensityProfile():
  GeneratorRunProfile {
  for (
    let seed = 1;
    seed <= 200;
    seed += 1
  ) {
    const profile =
      profileGeneratorRun({
        masterSeed: seed,
        acceptedPerArchetype: 1,
        shortlistPerArchetype: 1,
        maxAttemptsPerArchetype: 300,
      });

    if (
      profile.attempts.some(
        (attempt) =>
          attempt.status ===
            RejectionReason
              .MonsterDensity,
      )
    ) {
      return profile;
    }
  }

  throw new Error(
    'Expected a deterministic profile with at least one monster-density rejection within seed bound.',
  );
}

function runProfilerV12Checks(): void {
  const coverageProfile =
    profileGeneratorRun({
      masterSeed: 123456,
      acceptedPerArchetype: 1,
      shortlistPerArchetype: 1,
      maxAttemptsPerArchetype: 5000,
    });

  for (
    const archetype
    of [
      GeneratorArchetype
        .ChestTwoRooms,
      GeneratorArchetype
        .MixedTwoRooms,
    ]
  ) {
    const acceptedAttempts =
      coverageProfile.attempts
        .filter(
          (attempt) =>
            attempt.archetype ===
              archetype &&
            attempt.status ===
              CandidateStatus.Accepted,
        );

    assert(
      new Set(
        acceptedAttempts.map(
          (attempt) =>
            attempt.size,
        ),
      ).size === 2,
      `${archetype} profiler must mirror A+ 7x7/8x8 coverage.`,
    );
  }

  const densityProfile =
    findMonsterDensityProfile();

  for (
    const attempt
    of densityProfile.attempts
  ) {
    if (
      attempt.status !==
        RejectionReason
          .MonsterDensity
    ) {
      continue;
    }

    assert(
      attempt.solverDiagnostics ===
        null,
      'Monster-density rejection must happen before Solver diagnostics exist.',
    );

    assert(
      attempt.timings.solverMs === 0,
      'Monster-density rejection must spend zero recorded Solver time.',
    );

    assert(
      attempt.timings
        .humanDifficultyMs === 0,
      'Monster-density rejection must spend zero recorded Human Solver/Difficulty Analyzer time.',
    );
  }
}

function runTargetedProfilerParityChecks(): void {
  const config = {
    masterSeed: 1,
    acceptedPerArchetype: 1,
    shortlistPerArchetype: 1,
    maxAttemptsPerArchetype: 1,
    difficultyTarget:
      DifficultyTarget.Medium,
  } as const;

  const factory =
    createCandidatePool(config);

  const profiled =
    profileGeneratorRun(config);

  assert(
    profiled.completed ===
      factory.completed,
    'Targeted profiler/factory completion must match.',
  );

  assert(
    JSON.stringify(
      profiled.acceptedCandidateIds,
    ) ===
      JSON.stringify(
        factory.accepted.map(
          (entry) =>
            entry.candidate.id,
        ),
      ),
    'Targeted profiler must select the same final candidate IDs as CandidateFactory.',
  );

  for (const archetype of factory.archetypes) {
    const profiledArchetype =
      profiled.archetypes.find(
        (entry) =>
          entry.archetype ===
          archetype.stats.archetype,
      );

    const targetedDiagnostics =
      factory.targeting?.archetypes.find(
        (entry) =>
          entry.archetype ===
          archetype.stats.archetype,
      );

    assert(
      profiledArchetype !== undefined,
      `Targeted profiler must contain ${archetype.stats.archetype}.`,
    );

    assert(
      targetedDiagnostics !== undefined,
      `Targeted factory diagnostics must contain ${archetype.stats.archetype}.`,
    );

    if (
      profiledArchetype === undefined ||
      targetedDiagnostics === undefined
    ) {
      throw new Error(
        'Expected targeted profiler/factory archetype diagnostics.',
      );
    }

    assert(
      profiledArchetype.attempts ===
        archetype.stats.attempts,
      `${archetype.stats.archetype} targeted profiler attempts must match factory.`,
    );

    assert(
      profiledArchetype.reservoirAccepted ===
        targetedDiagnostics.reservoirCount,
      `${archetype.stats.archetype} targeted profiler reservoir count must match factory.`,
    );

    assert(
      profiledArchetype.accepted ===
        archetype.stats.accepted,
      `${archetype.stats.archetype} targeted profiler final accepted count must match factory.`,
    );
  }

  assert(
    profiled.targeting?.exactCount ===
      factory.targeting?.exactCount &&
      profiled.targeting?.fallbackCount ===
        factory.targeting?.fallbackCount &&
      profiled.targeting?.backfillCount ===
        factory.targeting?.backfillCount,
    'Targeted profiler/factory targeting diagnostics must match.',
  );

  assert(
    profiled.attempts.every(
      (attempt) =>
        attempt.status ===
          CandidateStatus.Accepted ||
        attempt.timings
          .humanDifficultyMs === 0,
    ),
    'Rejected targeted profiler attempts must spend zero recorded Human Solver/Difficulty Analyzer time.',
  );
}

function runProfileReportChecks(): void {
  const config = {
    masterSeed: 123456,
    acceptedPerArchetype: 1,
    shortlistPerArchetype: 1,
    maxAttemptsPerArchetype: 5000,
  } as const;

  const profile =
    profileGeneratorRun(config);

  const report =
    formatGeneratorProfileReport(
      profile,
      5,
    );

  const requiredSections = [
    'Generator profile seed 123456',
    'Archetype totals',
    'Time by status',
    'Top 5 slow attempts',
    'Top 5 solver node counts',
    'monster-only',
    'mixed-two-rooms',
    'solverMs=',
    'humanDifficultyMs=',
    'nodes=',
  ];

  for (
    const section
    of requiredSections
  ) {
    assert(
      report.includes(section),
      `Profile report must include "${section}".`,
    );
  }
}

async function runProfileCliChecks():
  Promise<void> {
  assert(
    parseProfileMasterSeed(
      [
        '--seed',
        '123456',
      ],
    ) === 123456,
    'Profiler CLI must parse a decimal uint32 seed.',
  );

  assert(
    parseProfileGeneratorCliArgs([
      '--seed',
      '123456',
    ]).difficultyTarget ===
      DifficultyTarget.Any,
    'Profiler CLI must preserve legacy any mode when no difficulty is supplied.',
  );

  assert(
    parseProfileGeneratorCliArgs([
      '--seed',
      '123456',
      '--difficulty',
      'hard',
    ]).difficultyTarget ===
      DifficultyTarget.Hard,
    'Profiler CLI must parse a targeted difficulty.',
  );

  let invalidSeedThrew = false;

  try {
    parseProfileMasterSeed(
      [
        '--seed',
        '-1',
      ],
    );
  } catch {
    invalidSeedThrew = true;
  }

  assert(
    invalidSeedThrew,
    'Profiler CLI must reject invalid seeds.',
  );

  const report =
    buildProfileGeneratorCliReport(
      [
        '--seed',
        '123456',
      ],
      {
        masterSeed: 0,
        acceptedPerArchetype: 1,
        shortlistPerArchetype: 1,
        maxAttemptsPerArchetype: 5000,
      },
      3,
    );

  assert(
    report.includes(
      'Generator profile seed 123456',
    ),
    'Profiler CLI report must use the requested seed.',
  );

  assert(
    report.includes(
      'Top 3 slow attempts',
    ),
    'Profiler CLI report must honor the requested top-N size.',
  );

  const packageJson =
    JSON.parse(
      await readFile(
        'package.json',
        'utf8',
      ),
    ) as {
      scripts?: Record<
        string,
        string
      >;
    };

  assert(
    packageJson.scripts?.[
      'profile:generator'
    ] ===
      'tsx src/dev/profileGeneratorCli.ts',
    'package.json must expose profile:generator CLI script.',
  );
}

async function main(): Promise<void> {
  console.info(
    '[Dungeon Logic] Profiler sanity',
  );

  runCandidateProfileChecks();

  console.info(
    'PASS: candidate evaluation profiling',
  );

  runProfilerV12Checks();

  console.info(
    'PASS: Generator v1.2 profiler parity',
  );

  runGeneratorRunProfileChecks();

  console.info(
    'PASS: generator run profiling parity',
  );

  runTargetedProfilerParityChecks();

  console.info(
    'PASS: targeted generator profiler parity',
  );

  runProfileReportChecks();

  console.info(
    'PASS: generator profile report',
  );

  await runProfileCliChecks();

  console.info(
    'PASS: generator profiler CLI',
  );

  console.info(
    '6/6 checks passed',
  );
}

void main().catch(
  (error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  },
);

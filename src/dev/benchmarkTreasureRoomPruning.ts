import {
  generateCandidate,
} from '../puzzle/generator/CandidateGenerator';

import {
  GeneratorArchetype,
} from '../puzzle/generator/types';

import {
  profileGeneratedCandidate,
} from './profileGenerator';

interface BaselineCase {
  seed: number;
  nodesVisited: number;
  solverMs: number;
}

const BASELINES:
  readonly BaselineCase[] = [
    {
      seed: 2567285821,
      nodesVisited: 4573081,
      solverMs: 105958.96,
    },
    {
      seed: 421722065,
      nodesVisited: 3755181,
      solverMs: 86668.71,
    },
    {
      seed: 3210444393,
      nodesVisited: 1227993,
      solverMs: 29622.34,
    },
    {
      seed: 1838594120,
      nodesVisited: 846523,
      solverMs: 19042.86,
    },
  ];

function formatNumber(
  value: number,
): string {
  return value.toLocaleString(
    'en-US',
  );
}

function formatRatio(
  before: number,
  after: number,
): string {
  if (after === 0) {
    return '∞x';
  }

  return `${(
    before / after
  ).toFixed(2)}x`;
}

function formatReduction(
  before: number,
  after: number,
): string {
  return `${(
    (1 - after / before) *
    100
  ).toFixed(2)}%`;
}

function main(): void {
  console.info(
    '[Dungeon Logic] Treasure Room pruning focused benchmark',
  );

  for (const baseline of BASELINES) {
    const generation =
      generateCandidate({
        archetype:
          GeneratorArchetype.ChestOneRoom,
        size: 8,
        seed: baseline.seed,
      });

    if (!generation.ok) {
      throw new Error(
        `Seed ${baseline.seed} failed generation: ${generation.reason}`,
      );
    }

    const profile =
      profileGeneratedCandidate(
        generation.candidate,
      );

    const diagnostics =
      profile.solverDiagnostics;

    if (diagnostics === null) {
      throw new Error(
        `Seed ${baseline.seed} did not reach solver profiling; status=${profile.evaluation.status}.`,
      );
    }

    console.info('');
    console.info(
      `seed=${baseline.seed} candidate=${generation.candidate.id} status=${profile.evaluation.status}`,
    );
    console.info(
      `nodes: ${formatNumber(baseline.nodesVisited)} -> ${formatNumber(diagnostics.nodesVisited)} | reduction=${formatReduction(baseline.nodesVisited, diagnostics.nodesVisited)} | speedup=${formatRatio(baseline.nodesVisited, diagnostics.nodesVisited)}`,
    );
    console.info(
      `branches=${formatNumber(diagnostics.branches)} propagationPasses=${formatNumber(diagnostics.propagationPasses)} maxDepth=${formatNumber(diagnostics.maxDepth)} completeCandidatesChecked=${formatNumber(diagnostics.completeCandidatesChecked)}`,
    );
    console.info(
      `solverMs: baseline≈${baseline.solverMs.toFixed(0)} -> current=${profile.timings.solverMs.toFixed(2)} | timingSpeedup≈${formatRatio(baseline.solverMs, profile.timings.solverMs)}`,
    );
  }
}

main();

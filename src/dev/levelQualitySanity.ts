import { levels } from '../data/levels';

import {
  analyzeLevelQuality,
} from '../puzzle/quality/LevelQualityAnalyzer';

import type {
  LevelDefinition,
} from '../puzzle/types';

interface SanityCase {
  name: string;
  run: () => void;
}

export function runLevelQualitySanityChecks(): void {
  const cases: readonly SanityCase[] = [
    {
      name: 'clue-only wall slab is rejected',
      run: checkClueOnlyWallSlabRejected,
    },
    {
      name: 'monster-assisted opening is preserved',
      run: checkMonsterAssistedOpening,
    },
    {
      name: 'authored diversity batch passes quality gate',
      run: checkAuthoredBatchQuality,
    },
  ];

  let passed = 0;

  console.group(
    '[Dungeon Logic] Level quality sanity',
  );

  for (const sanityCase of cases) {
    try {
      sanityCase.run();
      passed += 1;

      console.info(
        `PASS: ${sanityCase.name}`,
      );
    } catch (error) {
      console.error(
        `FAIL: ${sanityCase.name}`,
        error,
      );
    }
  }

  console.info(
    `${passed}/${cases.length} checks passed`,
  );

  console.groupEnd();

  if (passed !== cases.length) {
    throw new Error(
      'Level quality sanity checks failed.',
    );
  }
}

function checkClueOnlyWallSlabRejected(): void {
  const level: LevelDefinition = {
    id: 'quality-clue-slab',
    width: 8,
    height: 8,
    rowClues: [8, 4, 4, 4, 4, 4, 4, 0],
    columnClues: [4, 4, 4, 4, 4, 4, 4, 4],
    monsters: [],
    chests: [],
    blockers: [],
    doors: [],
    solution: [
      '########',
      '####....',
      '....####',
      '##..##..',
      '..##..##',
      '#.#.#.#.',
      '.#.#.#.#',
      '........',
    ],
  };

  const report =
    analyzeLevelQuality(level);

  assert(
    !report.passes,
    'A level with a full clue-only wall line must fail authored quality.',
  );

  assert(
    report.metrics.fullWallLineCount > 0,
    'Full wall line must be reported.',
  );

  assert(
    report.metrics.clueOnlyForcedWallCount > 0,
    'Clue-only propagation must identify forced walls.',
  );
}

function checkMonsterAssistedOpening(): void {
  const level: LevelDefinition = {
    id: 'quality-monster-assisted',
    width: 8,
    height: 8,
    rowClues: [6, 4, 4, 4, 4, 4, 4, 2],
    columnClues: [4, 4, 4, 4, 4, 4, 4, 4],
    monsters: [
      { x: 0, y: 0 },
      { x: 7, y: 0 },
    ],
    chests: [],
    blockers: [],
    doors: [],
    solution: [
      '.######.',
      '####....',
      '....####',
      '##..##..',
      '..##..##',
      '#.#.#.#.',
      '.#.#.#.#',
      '..#..#..',
    ],
  };

  const report =
    analyzeLevelQuality(level);

  assert(
    report.metrics.clueOnlyForcedWallCount === 0,
    'A 6/8 row must not count as clue-only forced before fixed objects are used.',
  );

  assert(
    report.metrics.objectAwareForcedWallCount >= 6,
    'Two fixed-open monsters should allow object-aware line propagation to force the other six row cells.',
  );

  assert(
    report.metrics.objectAssistedForcedWallCount >= 6,
    'Monster-assisted forced walls must be attributed separately from clue-only walls.',
  );
}

function checkAuthoredBatchQuality(): void {
  const failures: string[] = [];

  for (const level of levels.slice(4)) {
    const report =
      analyzeLevelQuality(level);

    if (!report.passes) {
      failures.push(
        `${level.id}: ${report.issues.join('; ')}`,
      );
    }
  }

  assert(
    failures.length === 0,
    `Authored quality failures:\n${failures.join('\n')}`,
  );
}

function assert(
  condition: boolean,
  message: string,
): void {
  if (!condition) {
    throw new Error(message);
  }
}

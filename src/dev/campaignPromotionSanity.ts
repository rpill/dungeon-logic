import { access, mkdtemp, readFile, rename, rm, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  analyzeCampaignPromotion,
  findGeneratedCandidate,
  parseCampaignPromotionArgs,
  promoteCampaignLevel,
  renderCampaignLevelModule,
  renderCampaignRegistry,
  validateCampaignHumanDifficulty,
  type CampaignPromotionFs,
} from './CampaignPromotion';
import { level001 } from '../data/levels/level001';
import { solveLevel } from '../puzzle/solver/PuzzleSolver';
import { analyzeHumanSolvability } from '../puzzle/human-solver/HumanSolver';
import { createEmptyHumanRuleCounts, HumanSolveStatus } from '../puzzle/human-solver/types';
import { analyzeDifficulty } from '../puzzle/difficulty/DifficultyAnalyzer';
import { DifficultyBand, ReasoningTier, type DifficultyProfile } from '../puzzle/difficulty/types';
import { GeneratorArchetype, type GeneratedCandidate, type GeneratorRunReport } from '../puzzle/generator/types';
import type { LevelDefinition } from '../puzzle/types';
import type { PromotedCampaignLevelSource } from '../content/campaign/types';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function expectThrow(action: () => unknown, message: string): void {
  let threw = false;
  try {
    action();
  } catch {
    threw = true;
  }
  assert(threw, message);
}

async function expectReject(action: () => Promise<unknown>, message: string): Promise<void> {
  let threw = false;
  try {
    await action();
  } catch {
    threw = true;
  }
  assert(threw, message);
}

function wrapGeneratedFixture(level: LevelDefinition): GeneratedCandidate {
  return {
    id: level.id,
    seed: 0,
    archetype: GeneratorArchetype.MonsterOnly,
    size: level.width === 6 || level.width === 7 || level.width === 8 ? level.width : 6,
    rooms: [],
    level,
  };
}

function findAccepted(
  report: GeneratorRunReport,
  archetype: GeneratedCandidate['archetype'],
  size: GeneratedCandidate['size'],
): GeneratedCandidate {
  const accepted = report.pool.accepted.find((entry) =>
    entry.candidate.archetype === archetype
    && entry.candidate.size === size
    && entry.difficulty.band === 'easy');
  if (accepted === undefined) {
    throw new Error(`Missing accepted fixture ${archetype} ${size}x${size}.`);
  }
  return accepted.candidate;
}

function provenanceSource(slot: number, level: LevelDefinition, candidate: GeneratedCandidate): PromotedCampaignLevelSource {
  return {
    slot,
    level,
    provenance: {
      sourceSeed: 123456,
      sourceCandidateId: candidate.id,
      sourceArchetype: candidate.archetype,
      difficulty: 'easy',
      difficultyScore: 1,
      humanStatus: 'solved-direct',
    },
  };
}

async function main(): Promise<void> {
  assert(parseCampaignPromotionArgs(['--seed', '0', '--candidate', 'x', '--slot', '1']).seed === 0, 'Seed 0 is valid uint32.');
  assert(parseCampaignPromotionArgs(['--seed', '4294967295', '--candidate', 'x', '--slot', '30']).seed === 0xffff_ffff, 'Max uint32 seed is valid.');
  expectThrow(() => parseCampaignPromotionArgs(['--seed', '-1', '--candidate', 'x', '--slot', '1']), 'Negative seed rejected.');
  expectThrow(() => parseCampaignPromotionArgs(['--seed', '4294967296', '--candidate', 'x', '--slot', '1']), 'Seed above uint32 rejected.');

  const report = JSON.parse(
    await readFile(join('.generated', 'candidates-123456.json'), 'utf8'),
  ) as GeneratorRunReport;

  const monster6 = findAccepted(report, GeneratorArchetype.MonsterOnly, 6);
  const chest7 = findAccepted(report, GeneratorArchetype.ChestOneRoom, 7);
  const mixed6 = findAccepted(report, GeneratorArchetype.MixedOneRoom, 6);

  assert(findGeneratedCandidate(report, monster6.id)?.id === monster6.id, 'Exact accepted candidate lookup works.');
  assert(findGeneratedCandidate(report, `${monster6.id}-suffix`) === null, 'Candidate lookup never uses partial ids.');

  const stuckHuman = {
    status: HumanSolveStatus.Stuck,
    directSteps: 0,
    contradictionSteps: 0,
    assignments: 0,
    unknownRemaining: 1,
    ruleCounts: createEmptyHumanRuleCounts(),
    steps: [],
  };
  const stuckDifficulty = analyzeDifficulty(monster6.level, stuckHuman);
  expectThrow(
    () => validateCampaignHumanDifficulty('stuck-fixture', stuckHuman, stuckDifficulty),
    'Campaign promotion rejects stuck human-solver results.',
  );

  const solvedHuman = analyzeHumanSolvability(monster6.level);
  const ratedDifficulty = analyzeDifficulty(monster6.level, solvedHuman);
  const unratedDifficulty: DifficultyProfile = {
    ...ratedDifficulty,
    score: null,
    band: DifficultyBand.Unrated,
    reasoningTier: ReasoningTier.Unrated,
    reasons: ['sanity unrated fixture'],
  };
  expectThrow(
    () => validateCampaignHumanDifficulty('unrated-fixture', solvedHuman, unratedDifficulty),
    'Campaign promotion rejects unrated difficulty profiles.',
  );

  const slot1 = analyzeCampaignPromotion(monster6, 1, []);
  assert(slot1.level.id === 'campaign-001', 'Slot 1 creates stable campaign id.');
  const slot1Source = provenanceSource(1, slot1.level, monster6);

  expectThrow(() => analyzeCampaignPromotion(monster6, 2, [slot1Source]), 'Slot 2 rejects monster-only.');
  const slot2 = analyzeCampaignPromotion(chest7, 2, [slot1Source]);
  assert(slot2.level.id === 'campaign-002', 'Slot 2 accepts easy 7x7 chest-one-room.');
  const slot2Source = provenanceSource(2, slot2.level, chest7);

  const slot3 = analyzeCampaignPromotion(monster6, 3, [slot1Source, slot2Source]);
  const slot3Source = provenanceSource(3, slot3.level, monster6);
  const slot4 = analyzeCampaignPromotion(mixed6, 4, [slot1Source, slot2Source, slot3Source]);
  assert(slot4.level.id === 'campaign-004', 'Slot 4 accepts easy 6x6 mixed-one-room.');

  const invalidCandidate = wrapGeneratedFixture({
    id: 'promotion-invalid-open-4x4',
    width: 4,
    height: 4,
    rowClues: [0, 0, 0, 0],
    columnClues: [0, 0, 0, 0],
    monsters: [], chests: [], blockers: [], doors: [],
    solution: ['....', '....', '....', '....'],
  });
  expectThrow(() => analyzeCampaignPromotion(invalidCandidate, 1, []), 'Canonical invalid candidates are rejected.');

  const ambiguousBase: LevelDefinition = {
    id: 'promotion-non-unique-4x4',
    width: 4,
    height: 4,
    rowClues: [1, 1, 1, 1],
    columnClues: [1, 1, 1, 1],
    monsters: [], chests: [], blockers: [], doors: [],
    solution: ['....', '....', '....', '....'],
  };
  const ambiguousSolve = solveLevel(ambiguousBase);
  assert(ambiguousSolve.firstSolution !== null, 'Ambiguous fixture exposes first solution.');
  const ambiguousCandidate = wrapGeneratedFixture({ ...ambiguousBase, solution: ambiguousSolve.firstSolution! });
  expectThrow(() => analyzeCampaignPromotion(ambiguousCandidate, 1, []), 'Canonical non-unique candidates are rejected.');

  expectThrow(() => analyzeCampaignPromotion(wrapGeneratedFixture(level001), 1, []), 'Canonical hard-quality candidates are rejected.');

  const warningLevel: LevelDefinition = {
    id: 'promotion-geometry-warning',
    width: 8,
    height: 8,
    rowClues: [5, 5, 4, 5, 4, 2, 2, 5],
    columnClues: [5, 5, 1, 4, 2, 5, 5, 5],
    monsters: [],
    chests: [{ x: 0, y: 7 }, { x: 2, y: 0 }],
    blockers: [],
    doors: [],
    solution: ['##...###', '##...###', '##....##', '#####...', '##...##.', '...#.#..', '...#...#', '...#####'],
  };
  expectThrow(() => analyzeCampaignPromotion(wrapGeneratedFixture(warningLevel), 1, []), 'Canonical geometry-warning candidates are rejected.');

  const blockerPosition = (() => {
    for (let y = 0; y < monster6.level.height; y += 1) {
      for (let x = 0; x < monster6.level.width; x += 1) {
        const fixed = monster6.level.monsters.some((p) => p.x === x && p.y === y)
          || monster6.level.chests.some((p) => p.x === x && p.y === y);
        if (!fixed && monster6.level.solution[y][x] === '.') return { x, y };
      }
    }
    throw new Error('No open blocker fixture cell.');
  })();
  const blockerCandidate: GeneratedCandidate = {
    ...monster6,
    id: `${monster6.id}-blocker`,
    level: { ...monster6.level, id: `${monster6.level.id}-blocker`, blockers: [blockerPosition] },
  };
  expectThrow(() => analyzeCampaignPromotion(blockerCandidate, 1, []), 'Campaign candidates with Blockers are rejected.');


  const doorCandidate: GeneratedCandidate = {
    ...monster6,
    id: `${monster6.id}-door`,
    level: {
      ...monster6.level,
      id: `${monster6.level.id}-door`,
      doors: [{ position: blockerPosition, orientation: 'horizontal' }],
    },
  };
  expectThrow(
    () => analyzeCampaignPromotion(doorCandidate, 1, []),
    'Campaign candidates with Directional Doors are rejected.',
  );

  const occupied = slot1Source;
  expectThrow(() => analyzeCampaignPromotion(monster6, 1, [occupied]), 'Occupied slot rejected by default.');
  analyzeCampaignPromotion(monster6, 1, [occupied], true);

  const provenance = occupied.provenance;
  const moduleA = renderCampaignLevelModule(slot1.level, provenance);
  const moduleB = renderCampaignLevelModule(slot1.level, provenance);
  assert(moduleA === moduleB, 'Rendered level module is byte-stable.');
  assert(renderCampaignRegistry([occupied]) === renderCampaignRegistry([occupied]), 'Rendered registry is byte-stable.');

  const tempDir = await mkdtemp(join(tmpdir(), 'dungeon-campaign-promotion-'));
  try {
    const originalRegistry = '// original registry\n';
    await writeFile(join(tempDir, 'index.ts'), originalRegistry, 'utf8');

    let renameCount = 0;
    const failingFs: CampaignPromotionFs = {
      readFile,
      writeFile,
      rename: async (from, to) => {
        renameCount += 1;
        if (renameCount === 2) throw new Error('simulated second rename failure');
        await rename(from, to);
      },
      unlink,
    };

    await expectReject(
      () => promoteCampaignLevel({
        seed: 123456,
        candidateId: monster6.id,
        slot: 1,
        replace: false,
        report,
        registry: [],
        levelsDir: tempDir,
      }, failingFs),
      'Second persistent write failure must reject promotion.',
    );

    assert(await readFile(join(tempDir, 'index.ts'), 'utf8') === originalRegistry, 'Rollback restores original registry.');
    await expectReject(() => access(join(tempDir, 'campaign001.ts')), 'Rollback removes half-promoted level file.');
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }

  console.info('[Dungeon Logic] Campaign promotion sanity: validation/render/rollback checks passed');
}

main().catch((error) => {
  console.error(error);
  (globalThis as { process?: { exitCode?: number } }).process!.exitCode = 1;
});

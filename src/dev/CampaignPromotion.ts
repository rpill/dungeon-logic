import { join } from 'node:path';

import { analyzeDifficulty } from '../puzzle/difficulty/DifficultyAnalyzer';
import { DifficultyBand, type DifficultyProfile } from '../puzzle/difficulty/types';
import { evaluateCandidate } from '../puzzle/generator/CandidateFactory';
import type {
  GeneratedCandidate,
  GeneratorRunReport,
} from '../puzzle/generator/types';
import { analyzeHumanSolvability } from '../puzzle/human-solver/HumanSolver';
import { HumanSolveStatus, type HumanSolveResult } from '../puzzle/human-solver/types';
import type { LevelDefinition } from '../puzzle/types';
import { getCampaignChapterForSlot } from '../content/campaign/chapters';
import { getCampaignCurationRule } from '../content/campaign/curationPlan';
import { getManuscriptForSlot } from '../content/campaign/manuscripts';
import { buildCampaignManifest } from '../content/campaign/manifest';
import type {
  CampaignLevelProvenance,
  PromotedCampaignLevelSource,
} from '../content/campaign/types';

export interface CampaignPromotionArgs {
  readonly seed: number;
  readonly candidateId: string;
  readonly slot: number;
  readonly replace: boolean;
}

export interface CampaignPromotionAnalysis {
  readonly slot: number;
  readonly level: LevelDefinition;
  readonly sourceCandidateId: string;
  readonly sourceArchetype: GeneratedCandidate['archetype'];
  readonly difficulty: CampaignLevelProvenance['difficulty'];
  readonly difficultyScore: number;
  readonly humanStatus: CampaignLevelProvenance['humanStatus'];
}

export interface CampaignPromotionFs {
  readFile(path: string, encoding: 'utf8'): Promise<string>;
  writeFile(path: string, data: string, encoding: 'utf8'): Promise<unknown>;
  rename(from: string, to: string): Promise<unknown>;
  unlink(path: string): Promise<unknown>;
}

export interface PromoteCampaignLevelOptions {
  readonly seed: number;
  readonly candidateId: string;
  readonly slot: number;
  readonly replace: boolean;
  readonly report: GeneratorRunReport;
  readonly registry: readonly PromotedCampaignLevelSource[];
  readonly levelsDir: string;
}

export interface CampaignPromotionResult {
  readonly source: PromotedCampaignLevelSource;
  readonly levelPath: string;
  readonly registryPath: string;
}

const UINT32_MAX = 0xffff_ffff;

export function parseCampaignPromotionArgs(argv: readonly string[]): CampaignPromotionArgs {
  let seedText: string | null = null;
  let candidateId: string | null = null;
  let slotText: string | null = null;
  let replace = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--replace') {
      if (replace) throw new Error('Duplicate --replace flag.');
      replace = true;
      continue;
    }

    if (arg !== '--seed' && arg !== '--candidate' && arg !== '--slot') {
      throw new Error(`Unknown campaign promotion argument: ${arg}.`);
    }

    const value = argv[index + 1];
    if (value === undefined || value.startsWith('--')) {
      throw new Error(`Missing value for ${arg}.`);
    }
    index += 1;

    if (arg === '--seed') {
      if (seedText !== null) throw new Error('Duplicate --seed argument.');
      seedText = value;
    } else if (arg === '--candidate') {
      if (candidateId !== null) throw new Error('Duplicate --candidate argument.');
      candidateId = value;
    } else {
      if (slotText !== null) throw new Error('Duplicate --slot argument.');
      slotText = value;
    }
  }

  if (seedText === null || !/^\d+$/.test(seedText)) {
    throw new Error('--seed is required and must be an unsigned decimal uint32.');
  }
  const seed = Number(seedText);
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > UINT32_MAX) {
    throw new Error('--seed must be in uint32 range 0..4294967295.');
  }

  if (candidateId === null || candidateId.trim().length === 0) {
    throw new Error('--candidate is required and must be non-empty.');
  }

  if (slotText === null || !/^\d+$/.test(slotText)) {
    throw new Error('--slot is required and must be an integer from 1 to 30.');
  }
  const slot = Number(slotText);
  if (!Number.isSafeInteger(slot) || slot < 1 || slot > 30) {
    throw new Error('--slot must be an integer from 1 to 30.');
  }

  return { seed, candidateId, slot, replace };
}

export function findGeneratedCandidate(
  report: GeneratorRunReport,
  candidateId: string,
): GeneratedCandidate | null {
  const accepted = report.pool.accepted.find(
    (entry) => entry.candidate.id === candidateId,
  );
  return accepted?.candidate ?? null;
}

export function analyzeCampaignPromotion(
  candidate: GeneratedCandidate,
  slot: number,
  registry: readonly PromotedCampaignLevelSource[],
  replace = false,
): CampaignPromotionAnalysis {
  const evaluation = evaluateCandidate(candidate);
  if (evaluation.status !== 'accepted') {
    throw new Error(
      `Candidate ${candidate.id} failed canonical generator acceptance: ${evaluation.status}${evaluation.diagnostic ? ` (${evaluation.diagnostic})` : ''}.`,
    );
  }

  const human = analyzeHumanSolvability(candidate.level);
  const difficulty = analyzeDifficulty(candidate.level, human);
  const humanDifficulty = validateCampaignHumanDifficulty(candidate.id, human, difficulty);

  if (candidate.level.blockers.length > 0 || candidate.level.doors.length > 0) {
    throw new Error(`Candidate ${candidate.id} uses Blockers or Directional Doors, which Campaign v1 excludes.`);
  }

  if (
    candidate.level.width !== candidate.size
    || candidate.level.height !== candidate.size
  ) {
    throw new Error(
      `Candidate ${candidate.id} metadata size ${candidate.size} does not match ${candidate.level.width}x${candidate.level.height} level dimensions.`,
    );
  }

  const rule = getCampaignCurationRule(slot);
  const chapter = getCampaignChapterForSlot(slot);
  if (rule.chapterId !== chapter.id) {
    throw new Error(
      `Campaign slot ${slot} curation chapter ${rule.chapterId} does not match chapter ownership ${chapter.id}.`,
    );
  }

  const manuscript = getManuscriptForSlot(slot);
  if (manuscript === null || rule.manuscriptId !== manuscript.id) {
    throw new Error(
      `Campaign slot ${slot} curation manuscript ${rule.manuscriptId} does not match manuscript ownership ${manuscript?.id ?? 'none'}.`,
    );
  }

  if (!rule.allowedArchetypes.includes(candidate.archetype)) {
    throw new Error(
      `Candidate ${candidate.id} archetype ${candidate.archetype} is not allowed for campaign slot ${slot}.`,
    );
  }
  if (!rule.allowedDifficulties.includes(humanDifficulty.difficulty)) {
    throw new Error(
      `Candidate ${candidate.id} difficulty ${humanDifficulty.difficulty} is not allowed for campaign slot ${slot}.`,
    );
  }
  if (!rule.allowedSizes.includes(candidate.size)) {
    throw new Error(
      `Candidate ${candidate.id} size ${candidate.size} is not allowed for campaign slot ${slot}.`,
    );
  }

  const occupied = registry.find((entry) => entry.slot === slot);
  if (occupied !== undefined && !replace) {
    throw new Error(`Campaign slot ${slot} is already occupied.`);
  }

  const stableId = campaignIdForSlot(slot);
  const stableLevel = cloneLevelWithId(candidate.level, stableId);
  const humanStatus = humanDifficulty.humanStatus;

  const placeholderSource: PromotedCampaignLevelSource = {
    slot,
    level: stableLevel,
    provenance: {
      sourceSeed: 0,
      sourceCandidateId: candidate.id,
      sourceArchetype: candidate.archetype,
      difficulty: humanDifficulty.difficulty,
      difficultyScore: humanDifficulty.difficultyScore,
      humanStatus,
    },
  };

  const prospectiveRegistry = [
    ...registry.filter((entry) => entry.slot !== slot),
    placeholderSource,
  ].sort((a, b) => a.slot - b.slot);

  buildCampaignManifest(prospectiveRegistry);

  return {
    slot,
    level: stableLevel,
    sourceCandidateId: candidate.id,
    sourceArchetype: candidate.archetype,
    difficulty: humanDifficulty.difficulty,
    difficultyScore: humanDifficulty.difficultyScore,
    humanStatus,
  };
}




export function validateCampaignHumanDifficulty(
  candidateId: string,
  human: HumanSolveResult,
  difficulty: DifficultyProfile,
): {
  readonly humanStatus: CampaignLevelProvenance['humanStatus'];
  readonly difficulty: CampaignLevelProvenance['difficulty'];
  readonly difficultyScore: number;
} {
  if (
    human.status !== HumanSolveStatus.SolvedDirect
    && human.status !== HumanSolveStatus.SolvedWithContradiction
  ) {
    throw new Error(`Candidate ${candidateId} is not human-solvable: ${human.status}.`);
  }

  if (difficulty.band === DifficultyBand.Unrated || difficulty.score === null) {
    throw new Error(`Candidate ${candidateId} has unrated campaign difficulty.`);
  }

  return {
    humanStatus: human.status,
    difficulty: difficulty.band,
    difficultyScore: difficulty.score,
  };
}

export function renderCampaignLevelModule(
  level: LevelDefinition,
  provenance: CampaignLevelProvenance,
): string {
  const stableLevel = {
    id: level.id,
    width: level.width,
    height: level.height,
    rowClues: [...level.rowClues],
    columnClues: [...level.columnClues],
    monsters: level.monsters.map(({ x, y }) => ({ x, y })),
    chests: level.chests.map(({ x, y }) => ({ x, y })),
    blockers: level.blockers.map(({ x, y }) => ({ x, y })),
    doors: level.doors.map((door) => ({
      position: { x: door.position.x, y: door.position.y },
      orientation: door.orientation,
    })),
    solution: [...level.solution],
  };

  const stableProvenance = {
    sourceSeed: provenance.sourceSeed,
    sourceCandidateId: provenance.sourceCandidateId,
    sourceArchetype: provenance.sourceArchetype,
    difficulty: provenance.difficulty,
    difficultyScore: provenance.difficultyScore,
    humanStatus: provenance.humanStatus,
  };

  return [
    "import type { CampaignLevelProvenance } from '../types';",
    "import type { LevelDefinition } from '../../../puzzle/types';",
    '',
    `export const level: LevelDefinition = ${JSON.stringify(stableLevel, null, 2)};`,
    '',
    `export const provenance: CampaignLevelProvenance = ${JSON.stringify(stableProvenance, null, 2)};`,
    '',
  ].join('\n');
}

export function renderCampaignRegistry(
  registry: readonly PromotedCampaignLevelSource[],
): string {
  const sorted = [...registry].sort((a, b) => a.slot - b.slot);
  const lines = ["import type { PromotedCampaignLevelSource } from '../types';"];

  for (const source of sorted) {
    const base = moduleBaseForSlot(source.slot);
    const symbol = `campaign${String(source.slot).padStart(3, '0')}`;
    lines.push(
      `import { level as ${symbol}, provenance as ${symbol}Provenance } from './${base}';`,
    );
  }

  lines.push('', 'export const promotedCampaignLevels = [');
  for (const source of sorted) {
    const symbol = `campaign${String(source.slot).padStart(3, '0')}`;
    lines.push(
      `  { slot: ${source.slot}, level: ${symbol}, provenance: ${symbol}Provenance },`,
    );
  }
  lines.push(
    '] as const satisfies readonly PromotedCampaignLevelSource[];',
    '',
  );

  return lines.join('\n');
}

export async function promoteCampaignLevel(
  options: PromoteCampaignLevelOptions,
  fsAdapter: CampaignPromotionFs,
): Promise<CampaignPromotionResult> {
  if (options.report.masterSeed !== options.seed) {
    throw new Error(
      `Candidate report seed ${options.report.masterSeed} does not match requested seed ${options.seed}.`,
    );
  }

  const candidate = findGeneratedCandidate(options.report, options.candidateId);
  if (candidate === null) {
    throw new Error(
      `Accepted candidate ${options.candidateId} was not found in report seed ${options.seed}.`,
    );
  }

  const analysis = analyzeCampaignPromotion(
    candidate,
    options.slot,
    options.registry,
    options.replace,
  );

  const provenance: CampaignLevelProvenance = {
    sourceSeed: options.seed,
    sourceCandidateId: analysis.sourceCandidateId,
    sourceArchetype: analysis.sourceArchetype,
    difficulty: analysis.difficulty,
    difficultyScore: analysis.difficultyScore,
    humanStatus: analysis.humanStatus,
  };

  const source: PromotedCampaignLevelSource = {
    slot: options.slot,
    level: analysis.level,
    provenance,
  };

  const prospectiveRegistry = [
    ...options.registry.filter((entry) => entry.slot !== options.slot),
    source,
  ].sort((a, b) => a.slot - b.slot);

  buildCampaignManifest(prospectiveRegistry);

  const levelText = renderCampaignLevelModule(source.level, source.provenance);
  const registryText = renderCampaignRegistry(prospectiveRegistry);

  const levelPath = join(options.levelsDir, `${moduleBaseForSlot(options.slot)}.ts`);
  const registryPath = join(options.levelsDir, 'index.ts');
  const levelTempPath = `${levelPath}.tmp`;
  const registryTempPath = `${registryPath}.tmp`;

  const originalLevel = await readOptional(fsAdapter, levelPath);
  const originalRegistry = await readOptional(fsAdapter, registryPath);

  if (originalLevel !== null && !options.replace) {
    throw new Error(`Campaign level file already exists: ${levelPath}.`);
  }

  await safeUnlink(fsAdapter, levelTempPath);
  await safeUnlink(fsAdapter, registryTempPath);

  await fsAdapter.writeFile(levelTempPath, levelText, 'utf8');
  await fsAdapter.writeFile(registryTempPath, registryText, 'utf8');

  let levelCommitted = false;
  try {
    await fsAdapter.rename(levelTempPath, levelPath);
    levelCommitted = true;
    await fsAdapter.rename(registryTempPath, registryPath);
  } catch (error) {
    if (levelCommitted) {
      if (originalLevel === null) {
        await safeUnlink(fsAdapter, levelPath);
      } else {
        await fsAdapter.writeFile(levelPath, originalLevel, 'utf8');
      }
    }

    if (originalRegistry !== null) {
      await fsAdapter.writeFile(registryPath, originalRegistry, 'utf8');
    } else {
      await safeUnlink(fsAdapter, registryPath);
    }

    await safeUnlink(fsAdapter, levelTempPath);
    await safeUnlink(fsAdapter, registryTempPath);
    throw error;
  }

  await safeUnlink(fsAdapter, levelTempPath);
  await safeUnlink(fsAdapter, registryTempPath);

  return { source, levelPath, registryPath };
}

function campaignIdForSlot(slot: number): string {
  return `campaign-${String(slot).padStart(3, '0')}`;
}

function moduleBaseForSlot(slot: number): string {
  return `campaign${String(slot).padStart(3, '0')}`;
}

function cloneLevelWithId(level: LevelDefinition, id: string): LevelDefinition {
  return {
    id,
    width: level.width,
    height: level.height,
    rowClues: [...level.rowClues],
    columnClues: [...level.columnClues],
    monsters: level.monsters.map(({ x, y }) => ({ x, y })),
    chests: level.chests.map(({ x, y }) => ({ x, y })),
    blockers: level.blockers.map(({ x, y }) => ({ x, y })),
    doors: level.doors.map((door) => ({
      position: { x: door.position.x, y: door.position.y },
      orientation: door.orientation,
    })),
    solution: [...level.solution],
  };
}

async function readOptional(
  fsAdapter: CampaignPromotionFs,
  path: string,
): Promise<string | null> {
  try {
    return await fsAdapter.readFile(path, 'utf8');
  } catch (error) {
    if (isMissingFileError(error)) return null;
    throw error;
  }
}

async function safeUnlink(fsAdapter: CampaignPromotionFs, path: string): Promise<void> {
  try {
    await fsAdapter.unlink(path);
  } catch (error) {
    if (!isMissingFileError(error)) throw error;
  }
}

function isMissingFileError(error: unknown): boolean {
  return typeof error === 'object'
    && error !== null
    && 'code' in error
    && (error as { code?: unknown }).code === 'ENOENT';
}

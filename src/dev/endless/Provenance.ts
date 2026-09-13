import {
  createHash,
} from 'node:crypto';
import {
  readdirSync,
  readFileSync,
  statSync,
} from 'node:fs';
import {
  join,
  relative,
  resolve,
} from 'node:path';

export interface EndlessProvenance {
  readonly generatorVersion: number;
  readonly difficultyModelVersion: number;
  readonly solverSourceHash: string;
  readonly generatorSourceHash: string;
  readonly gameRulesSourceHash: string;
  readonly campaignContentHash: string;
  readonly dailyContentHash: string;
}

export function buildEndlessProvenance(
  projectRoot: string,
): EndlessProvenance {
  const root = resolve(projectRoot);
  return {
    generatorVersion: 1,
    difficultyModelVersion: 1,
    solverSourceHash: hashPathGroup(root, [
      'src/puzzle/solver',
    ]),
    generatorSourceHash: hashPathGroup(root, [
      'src/puzzle/generator',
    ]),
    gameRulesSourceHash: hashPathGroup(root, [
      'src/puzzle/LevelValidator.ts',
      'src/puzzle/quality',
      'src/puzzle/human-solver',
      'src/puzzle/difficulty',
    ]),
    campaignContentHash: hashPathGroup(root, [
      'src/content/campaign/levels',
    ]),
    dailyContentHash: hashPathGroup(root, [
      'src/content/daily',
    ]),
  };
}

export function hashPathGroup(
  projectRoot: string,
  relativePaths: readonly string[],
): string {
  const files = relativePaths
    .flatMap((path) => collectFiles(join(projectRoot, path)))
    .sort((left, right) => left.localeCompare(right));

  if (files.length === 0) {
    throw new Error(
      `Cannot hash empty Endless source group: ${relativePaths.join(', ')}.`,
    );
  }

  const hash = createHash('sha256');
  for (const filePath of files) {
    const rel = relative(projectRoot, filePath)
      .split('\\')
      .join('/');
    hash.update(rel, 'utf8');
    hash.update('\0', 'utf8');
    hash.update(readFileSync(filePath));
    hash.update('\0', 'utf8');
  }
  return hash.digest('hex');
}

function collectFiles(path: string): readonly string[] {
  const stats = statSync(path);
  if (stats.isFile()) return [path];
  if (!stats.isDirectory()) return [];

  return readdirSync(path)
    .flatMap((name) =>
      collectFiles(join(path, name)),
    );
}

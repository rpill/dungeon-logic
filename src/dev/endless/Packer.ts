import {
  createHash,
} from 'node:crypto';
import {
  mkdirSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import {
  join,
} from 'node:path';

import {
  ENDLESS_CATALOG_VERSION,
  ENDLESS_RECORD_SIZE,
  encodeEndlessCatalog,
  type EndlessCatalogEntry,
  type EndlessCatalogManifest,
  type EndlessManifestScanPlanEntry,
  type RatedDifficultyBand,
} from '../../content/endless/CatalogFormat';
import {
  ALL_GENERATOR_ARCHETYPES,
  type GeneratorArchetype,
} from '../../puzzle/generator/types';
import type {
  EndlessProvenance,
} from './Provenance';
import {
  hashEndlessSelection,
} from './SelectionHash';
import type {
  EndlessSelectionRecord,
  EndlessVerificationReport,
} from './types';

export interface PackEndlessCatalogOptions {
  readonly outputDir: string;
  readonly targetCount: number;
  readonly sourceScanPlan: readonly EndlessManifestScanPlanEntry[];
  readonly provenance: EndlessProvenance;
}

export interface PackedEndlessCatalog {
  readonly binaryPath: string;
  readonly manifestPath: string;
  readonly manifest: EndlessCatalogManifest;
}

export function packEndlessCatalog(
  selection: readonly EndlessSelectionRecord[],
  verification: EndlessVerificationReport,
  options: PackEndlessCatalogOptions,
): PackedEndlessCatalog {
  if (
    !Number.isInteger(options.targetCount) ||
    options.targetCount <= 0
  ) {
    throw new RangeError(
      'Endless pack targetCount must be a positive integer.',
    );
  }
  if (selection.length !== options.targetCount) {
    throw new Error(
      `Endless pack requires ${options.targetCount} selected entries; got ${selection.length}.`,
    );
  }
  if (
    verification.selectionHash !== hashEndlessSelection(selection)
  ) {
    throw new Error(
      'Endless verification report does not match the selected catalog.',
    );
  }
  if (
    !verification.ok ||
    verification.rejectedVerificationCount !== 0 ||
    verification.verifiedCount !== selection.length
  ) {
    throw new Error(
      'Endless pack requires a fully successful verification report.',
    );
  }

  const entries: readonly EndlessCatalogEntry[] =
    selection.map((entry) => ({
      seed: entry.seed,
      archetype: entry.archetype,
      size: entry.size,
      difficultyScore: entry.difficultyScore,
      difficultyBand: entry.difficultyBand,
    }));
  const binary = encodeEndlessCatalog(entries);
  const productionAssetHash = sha256(binary);
  const manifest = buildManifest(
    selection,
    verification,
    options,
    productionAssetHash,
  );

  mkdirSync(options.outputDir, {
    recursive: true,
  });
  const binaryPath = join(
    options.outputDir,
    'verified-levels.bin',
  );
  const manifestPath = join(
    options.outputDir,
    'verified-levels-manifest.json',
  );
  const binaryTemp = `${binaryPath}.tmp-${process.pid}`;
  const manifestTemp = `${manifestPath}.tmp-${process.pid}`;

  writeFileSync(binaryTemp, binary);
  writeFileSync(
    manifestTemp,
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  );
  renameSync(binaryTemp, binaryPath);
  renameSync(manifestTemp, manifestPath);

  return {
    binaryPath,
    manifestPath,
    manifest,
  };
}

function buildManifest(
  selection: readonly EndlessSelectionRecord[],
  verification: EndlessVerificationReport,
  options: PackEndlessCatalogOptions,
  productionAssetHash: string,
): EndlessCatalogManifest {
  const countsByBand: Record<RatedDifficultyBand, number> = {
    easy: 0,
    medium: 0,
    hard: 0,
    expert: 0,
  };
  const countsByArchetype = Object.fromEntries(
    ALL_GENERATOR_ARCHETYPES.map(
      (archetype) => [archetype, 0],
    ),
  ) as Record<GeneratorArchetype, number>;
  const countsBySize: Record<'6' | '7' | '8', number> = {
    '6': 0,
    '7': 0,
    '8': 0,
  };
  const scoreHistogram = Array.from(
    { length: 101 },
    () => 0,
  );

  for (const entry of selection) {
    countsByBand[entry.difficultyBand] += 1;
    countsByArchetype[entry.archetype] += 1;
    countsBySize[String(entry.size) as '6' | '7' | '8'] += 1;
    scoreHistogram[entry.difficultyScore] += 1;
  }

  return {
    catalogVersion: ENDLESS_CATALOG_VERSION,
    recordSize: ENDLESS_RECORD_SIZE,
    entryCount: selection.length,
    catalogTargetCount: options.targetCount,
    generatorVersion: options.provenance.generatorVersion,
    difficultyModelVersion:
      options.provenance.difficultyModelVersion,
    solverSourceHash:
      options.provenance.solverSourceHash,
    generatorSourceHash:
      options.provenance.generatorSourceHash,
    gameRulesSourceHash:
      options.provenance.gameRulesSourceHash,
    campaignContentHash:
      options.provenance.campaignContentHash,
    dailyContentHash:
      options.provenance.dailyContentHash,
    sourceScanPlan: options.sourceScanPlan,
    verifiedCount: verification.verifiedCount,
    rejectedVerificationCount:
      verification.rejectedVerificationCount,
    duplicateCount: verification.duplicateCount,
    campaignCollisionCount:
      verification.campaignCollisionCount,
    dailyCollisionCount:
      verification.dailyCollisionCount,
    countsByBand,
    countsByArchetype,
    countsBySize,
    scoreHistogram,
    productionAssetHash,
  };
}

function sha256(
  bytes: Uint8Array,
): string {
  return createHash('sha256')
    .update(bytes)
    .digest('hex');
}

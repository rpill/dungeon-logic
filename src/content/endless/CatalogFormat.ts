import {
  DifficultyBand,
  type DifficultyBand as DifficultyBandValue,
} from '../../puzzle/difficulty/types';
import {
  GeneratorArchetype,
  type GeneratorArchetype as GeneratorArchetypeValue,
  type GeneratorBoardSize,
} from '../../puzzle/generator/types';

export const ENDLESS_CATALOG_VERSION = 1 as const;
export const ENDLESS_RECORD_SIZE = 8 as const;
export const ENDLESS_TARGET_COUNT = 100_000 as const;

export type RatedDifficultyBand = Exclude<
  DifficultyBandValue,
  typeof DifficultyBand.Unrated
>;

export interface EndlessCatalogEntry {
  readonly seed: number;
  readonly archetype: GeneratorArchetypeValue;
  readonly size: GeneratorBoardSize;
  readonly difficultyScore: number;
  readonly difficultyBand: RatedDifficultyBand;
}

export interface EndlessManifestScanPlanEntry {
  readonly laneId: string;
  readonly archetype: GeneratorArchetypeValue;
  readonly size: GeneratorBoardSize;
  readonly startAttempt: number;
  readonly attemptCount: number;
}

export interface EndlessCatalogManifest {
  readonly catalogVersion: 1;
  readonly recordSize: 8;
  readonly entryCount: number;
  readonly catalogTargetCount: number;
  readonly generatorVersion: number;
  readonly difficultyModelVersion: number;
  readonly solverSourceHash: string;
  readonly generatorSourceHash: string;
  readonly gameRulesSourceHash: string;
  readonly campaignContentHash: string;
  readonly dailyContentHash: string;
  readonly sourceScanPlan: readonly EndlessManifestScanPlanEntry[];
  readonly verifiedCount: number;
  readonly rejectedVerificationCount: number;
  readonly duplicateCount: number;
  readonly campaignCollisionCount: number;
  readonly dailyCollisionCount: number;
  readonly countsByBand: Readonly<Record<RatedDifficultyBand, number>>;
  readonly countsByArchetype: Readonly<Record<GeneratorArchetypeValue, number>>;
  readonly countsBySize: Readonly<Record<'6' | '7' | '8', number>>;
  readonly scoreHistogram: readonly number[];
  readonly productionAssetHash: string;
}

const ARCHETYPE_TO_CODE: Readonly<Record<GeneratorArchetypeValue, number>> = {
  [GeneratorArchetype.MonsterOnly]: 0,
  [GeneratorArchetype.ChestOneRoom]: 1,
  [GeneratorArchetype.ChestTwoRooms]: 2,
  [GeneratorArchetype.MixedOneRoom]: 3,
  [GeneratorArchetype.MixedTwoRooms]: 4,
};

const CODE_TO_ARCHETYPE: readonly GeneratorArchetypeValue[] = [
  GeneratorArchetype.MonsterOnly,
  GeneratorArchetype.ChestOneRoom,
  GeneratorArchetype.ChestTwoRooms,
  GeneratorArchetype.MixedOneRoom,
  GeneratorArchetype.MixedTwoRooms,
];

const BAND_TO_CODE: Readonly<Record<RatedDifficultyBand, number>> = {
  [DifficultyBand.Easy]: 0,
  [DifficultyBand.Medium]: 1,
  [DifficultyBand.Hard]: 2,
  [DifficultyBand.Expert]: 3,
};

const CODE_TO_BAND: readonly RatedDifficultyBand[] = [
  DifficultyBand.Easy,
  DifficultyBand.Medium,
  DifficultyBand.Hard,
  DifficultyBand.Expert,
];

export function encodeEndlessCatalog(
  entries: readonly EndlessCatalogEntry[],
): Uint8Array {
  const bytes = new Uint8Array(
    entries.length * ENDLESS_RECORD_SIZE,
  );
  const view = new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength,
  );

  entries.forEach((entry, index) => {
    validateEntry(entry, index);
    const offset = index * ENDLESS_RECORD_SIZE;
    view.setUint32(offset, entry.seed, true);
    view.setUint8(
      offset + 4,
      ARCHETYPE_TO_CODE[entry.archetype],
    );
    view.setUint8(offset + 5, entry.size);
    view.setUint8(
      offset + 6,
      entry.difficultyScore,
    );
    view.setUint8(
      offset + 7,
      BAND_TO_CODE[entry.difficultyBand],
    );
  });

  return bytes;
}

export function decodeEndlessCatalog(
  input: ArrayBuffer | Uint8Array,
  manifest: EndlessCatalogManifest,
): readonly EndlessCatalogEntry[] {
  validateManifestHeader(manifest);

  const bytes =
    input instanceof Uint8Array
      ? input
      : new Uint8Array(input);

  const expectedLength =
    manifest.entryCount * ENDLESS_RECORD_SIZE;
  if (bytes.byteLength !== expectedLength) {
    throw new Error(
      `Endless catalog byte length mismatch: expected ${expectedLength}, got ${bytes.byteLength}.`,
    );
  }

  const view = new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength,
  );
  const entries: EndlessCatalogEntry[] = [];

  for (
    let index = 0;
    index < manifest.entryCount;
    index += 1
  ) {
    const offset = index * ENDLESS_RECORD_SIZE;
    const seed = view.getUint32(offset, true);
    const archetypeCode = view.getUint8(offset + 4);
    const size = view.getUint8(offset + 5);
    const difficultyScore = view.getUint8(offset + 6);
    const bandCode = view.getUint8(offset + 7);

    const archetype = CODE_TO_ARCHETYPE[archetypeCode];
    if (archetype === undefined) {
      throw new Error(
        `Invalid Endless archetype code ${archetypeCode} at record ${index}.`,
      );
    }
    if (!isGeneratorBoardSize(size)) {
      throw new Error(
        `Invalid Endless board size ${size} at record ${index}.`,
      );
    }
    if (difficultyScore > 100) {
      throw new Error(
        `Invalid Endless difficulty score ${difficultyScore} at record ${index}.`,
      );
    }
    const difficultyBand = CODE_TO_BAND[bandCode];
    if (difficultyBand === undefined) {
      throw new Error(
        `Invalid Endless difficulty band code ${bandCode} at record ${index}.`,
      );
    }

    entries.push({
      seed,
      archetype,
      size,
      difficultyScore,
      difficultyBand,
    });
  }

  return entries;
}

export function isEndlessCatalogManifest(
  value: unknown,
): value is EndlessCatalogManifest {
  if (
    typeof value !== 'object' ||
    value === null
  ) {
    return false;
  }

  const manifest = value as Partial<EndlessCatalogManifest>;
  return (
    manifest.catalogVersion === ENDLESS_CATALOG_VERSION &&
    manifest.recordSize === ENDLESS_RECORD_SIZE &&
    Number.isInteger(manifest.entryCount) &&
    (manifest.entryCount ?? -1) >= 0 &&
    Number.isInteger(manifest.catalogTargetCount) &&
    (manifest.catalogTargetCount ?? -1) >= 0
  );
}

function validateManifestHeader(
  manifest: EndlessCatalogManifest,
): void {
  if (
    manifest.catalogVersion !==
    ENDLESS_CATALOG_VERSION
  ) {
    throw new Error(
      `Unsupported Endless catalog version ${manifest.catalogVersion}; expected ${ENDLESS_CATALOG_VERSION}.`,
    );
  }
  if (
    manifest.recordSize !==
    ENDLESS_RECORD_SIZE
  ) {
    throw new Error(
      `Unsupported Endless record size ${manifest.recordSize}; expected ${ENDLESS_RECORD_SIZE}.`,
    );
  }
  if (
    !Number.isInteger(manifest.entryCount) ||
    manifest.entryCount < 0
  ) {
    throw new Error(
      `Invalid Endless entry count ${manifest.entryCount}.`,
    );
  }
}

function validateEntry(
  entry: EndlessCatalogEntry,
  index: number,
): void {
  if (
    !Number.isInteger(entry.seed) ||
    entry.seed < 0 ||
    entry.seed > 0xffff_ffff
  ) {
    throw new RangeError(
      `Invalid Endless seed ${entry.seed} at record ${index}.`,
    );
  }
  if (
    ARCHETYPE_TO_CODE[entry.archetype] ===
    undefined
  ) {
    throw new RangeError(
      `Invalid Endless archetype ${String(entry.archetype)} at record ${index}.`,
    );
  }
  if (!isGeneratorBoardSize(entry.size)) {
    throw new RangeError(
      `Invalid Endless board size ${entry.size} at record ${index}.`,
    );
  }
  if (
    !Number.isInteger(entry.difficultyScore) ||
    entry.difficultyScore < 0 ||
    entry.difficultyScore > 100
  ) {
    throw new RangeError(
      `Invalid Endless difficulty score ${entry.difficultyScore} at record ${index}.`,
    );
  }
  if (
    BAND_TO_CODE[entry.difficultyBand] ===
    undefined
  ) {
    throw new RangeError(
      `Invalid Endless difficulty band ${String(entry.difficultyBand)} at record ${index}.`,
    );
  }
}

function isGeneratorBoardSize(
  value: number,
): value is GeneratorBoardSize {
  return value === 6 || value === 7 || value === 8;
}

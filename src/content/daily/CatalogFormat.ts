import {
  GeneratorArchetype,
  type GeneratorArchetype as GeneratorArchetypeValue,
} from '../../puzzle/generator/types';
import type { GridPosition, LevelDefinition } from '../../puzzle/types';

export const DAILY_CATALOG_VERSION = 1 as const;
export const DAILY_RECORD_SIZE = 28 as const;
export const DAILY_TARGET_COUNT = 7305 as const;

export interface DailyCatalogRecord {
  readonly size: 7 | 8;
  readonly difficultyScore: number;
  readonly archetype: GeneratorArchetypeValue;
  readonly level: LevelDefinition;
}

export interface DailyCatalogManifest {
  readonly catalogVersion: 1;
  readonly recordSize: 28;
  readonly entryCount: number;
  readonly catalogTargetCount: number;
  readonly startDate: string;
  readonly endDate: string;
  readonly verifiedCount: number;
  readonly duplicateCount: number;
  readonly campaignCollisionCount: number;
  readonly endlessCollisionCount: number;
  readonly weekdayViolationCount: number;
  readonly countsByArchetype: Readonly<Record<string, number>>;
  readonly countsBySize: Readonly<Record<'7' | '8', number>>;
  readonly scoreHistogram: readonly number[];
  readonly productionAssetHash: string;
}

const ARCHETYPE_TO_CODE: Readonly<Record<string, number>> = {
  [GeneratorArchetype.MonsterOnly]: 0,
  [GeneratorArchetype.ChestOneRoom]: 1,
  [GeneratorArchetype.MixedOneRoom]: 2,
};

const CODE_TO_ARCHETYPE = [
  GeneratorArchetype.MonsterOnly,
  GeneratorArchetype.ChestOneRoom,
  GeneratorArchetype.MixedOneRoom,
] as const;

export function isDailyCatalogManifest(value: unknown): value is DailyCatalogManifest {
  if (typeof value !== 'object' || value === null) return false;
  const manifest = value as Partial<DailyCatalogManifest>;
  return manifest.catalogVersion === DAILY_CATALOG_VERSION
    && manifest.recordSize === DAILY_RECORD_SIZE
    && Number.isInteger(manifest.entryCount)
    && (manifest.entryCount ?? -1) >= 0
    && Number.isInteger(manifest.catalogTargetCount)
    && (manifest.catalogTargetCount ?? -1) >= 0
    && typeof manifest.startDate === 'string'
    && typeof manifest.endDate === 'string';
}

export function encodeDailyCatalog(records: readonly DailyCatalogRecord[]): Uint8Array {
  const bytes = new Uint8Array(records.length * DAILY_RECORD_SIZE);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  records.forEach((record, index) => {
    const { level } = record;
    if ((record.size !== 7 && record.size !== 8) || level.width !== record.size || level.height !== record.size) {
      throw new Error(`Daily record ${index} must be a square 7x7 or 8x8 level.`);
    }
    if (level.blockers.length !== 0 || level.doors.length !== 0) {
      throw new Error(`Daily record ${index} contains unsupported blockers or doors.`);
    }
    if (!Number.isInteger(record.difficultyScore) || record.difficultyScore < 0 || record.difficultyScore > 100) {
      throw new Error(`Daily record ${index} has invalid difficulty score ${record.difficultyScore}.`);
    }
    const archetypeCode = ARCHETYPE_TO_CODE[record.archetype];
    if (archetypeCode === undefined) {
      throw new Error(`Daily record ${index} has unsupported archetype ${record.archetype}.`);
    }

    const offset = index * DAILY_RECORD_SIZE;
    view.setUint8(offset, record.size);
    view.setUint8(offset + 1, record.difficultyScore);
    view.setUint8(offset + 2, archetypeCode);
    view.setUint8(offset + 3, 0);
    writeMask(view, offset + 4, solutionWallPositions(level.solution));
    writeMask(view, offset + 12, level.monsters);
    writeMask(view, offset + 20, level.chests);
  });

  return bytes;
}

export function decodeDailyCatalogRecord(
  input: ArrayBuffer | Uint8Array,
  manifest: DailyCatalogManifest,
  index: number,
  id: string,
): DailyCatalogRecord {
  validateCatalogBounds(input, manifest, index);
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const offset = index * DAILY_RECORD_SIZE;
  const size = view.getUint8(offset);
  if (size !== 7 && size !== 8) throw new Error(`Invalid Daily board size ${size} at record ${index}.`);
  const difficultyScore = view.getUint8(offset + 1);
  if (difficultyScore > 100) throw new Error(`Invalid Daily difficulty score ${difficultyScore} at record ${index}.`);
  const archetype = CODE_TO_ARCHETYPE[view.getUint8(offset + 2)];
  if (archetype === undefined) throw new Error(`Invalid Daily archetype code at record ${index}.`);
  if (view.getUint8(offset + 3) !== 0) throw new Error(`Unsupported Daily record flags at record ${index}.`);

  const wallPositions = readMask(view, offset + 4, size);
  const monsters = readMask(view, offset + 12, size);
  const chests = readMask(view, offset + 20, size);
  const wallSet = new Set(wallPositions.map((position) => `${position.x},${position.y}`));
  const solution = Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x) => wallSet.has(`${x},${y}`) ? '#' : '.').join(''),
  );
  const rowClues = solution.map((row) => countWalls(row));
  const columnClues = Array.from({ length: size }, (_, x) =>
    solution.reduce((sum, row) => sum + (row[x] === '#' ? 1 : 0), 0),
  );

  return {
    size,
    difficultyScore,
    archetype,
    level: {
      id,
      width: size,
      height: size,
      rowClues,
      columnClues,
      monsters,
      chests,
      blockers: [],
      doors: [],
      solution,
    },
  };
}

function validateCatalogBounds(
  input: ArrayBuffer | Uint8Array,
  manifest: DailyCatalogManifest,
  index: number,
): void {
  if (!isDailyCatalogManifest(manifest)) throw new Error('Daily manifest has an invalid header.');
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  const expectedLength = manifest.entryCount * DAILY_RECORD_SIZE;
  if (bytes.byteLength !== expectedLength) {
    throw new Error(`Daily catalog byte length mismatch: expected ${expectedLength}, got ${bytes.byteLength}.`);
  }
  if (!Number.isInteger(index) || index < 0 || index >= manifest.entryCount) {
    throw new RangeError(`Daily catalog index ${index} is out of range.`);
  }
}

function solutionWallPositions(solution: readonly string[]): readonly GridPosition[] {
  const positions: GridPosition[] = [];
  solution.forEach((row, y) => {
    for (let x = 0; x < row.length; x += 1) {
      if (row[x] === '#') positions.push({ x, y });
    }
  });
  return positions;
}

function writeMask(view: DataView, offset: number, positions: readonly GridPosition[]): void {
  let low = 0;
  let high = 0;
  for (const position of positions) {
    if (!Number.isInteger(position.x) || !Number.isInteger(position.y) || position.x < 0 || position.x >= 8 || position.y < 0 || position.y >= 8) {
      throw new Error(`Daily mask position ${position.x},${position.y} is outside 8x8 storage.`);
    }
    const bit = position.y * 8 + position.x;
    if (bit < 32) low = (low | (1 << bit)) >>> 0;
    else high = (high | (1 << (bit - 32))) >>> 0;
  }
  view.setUint32(offset, low, true);
  view.setUint32(offset + 4, high, true);
}

function readMask(view: DataView, offset: number, size: 7 | 8): GridPosition[] {
  const low = view.getUint32(offset, true);
  const high = view.getUint32(offset + 4, true);
  const positions: GridPosition[] = [];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const bit = y * 8 + x;
      const word = bit < 32 ? low : high;
      const shift = bit < 32 ? bit : bit - 32;
      if (((word >>> shift) & 1) !== 0) positions.push({ x, y });
    }
  }
  return positions;
}

function countWalls(row: string): number {
  let count = 0;
  for (const cell of row) if (cell === '#') count += 1;
  return count;
}

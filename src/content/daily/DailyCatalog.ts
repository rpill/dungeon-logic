import {
  decodeDailyCatalogRecord,
  type DailyCatalogManifest,
} from './CatalogFormat';
import {
  DAILY_RELEASE_DATE_KEYS,
  formatDailyId,
} from './calendar';
import type { DailyEntry } from './types';
import type { LevelDefinition } from '../../puzzle/types';

export interface DailyCatalog {
  readonly length: number;
  readonly entries: readonly DailyEntry[];
  createLevel(index: number): LevelDefinition;
  getEntry(index: number): DailyEntry;
}

export function createDailyCatalog(
  input: ArrayBuffer | Uint8Array,
  manifest: DailyCatalogManifest,
): DailyCatalog {
  if (manifest.entryCount !== DAILY_RELEASE_DATE_KEYS.length) {
    throw new Error(`Daily manifest has ${manifest.entryCount} entries for ${DAILY_RELEASE_DATE_KEYS.length} release dates.`);
  }
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  const levelCache: Array<LevelDefinition | undefined> = new Array(manifest.entryCount);
  const entryCache: Array<DailyEntry | undefined> = new Array(manifest.entryCount);

  const createLevel = (index: number): LevelDefinition => {
    const cached = levelCache[index];
    if (cached !== undefined) return cached;
    const id = formatDailyId(index);
    const level = decodeDailyCatalogRecord(bytes, manifest, index, id).level;
    levelCache[index] = level;
    return level;
  };

  const getEntry = (index: number): DailyEntry => {
    if (!Number.isInteger(index) || index < 0 || index >= manifest.entryCount) {
      throw new RangeError(`Daily catalog index ${index} is out of range.`);
    }
    const cached = entryCache[index];
    if (cached !== undefined) return cached;
    const id = formatDailyId(index);
    const dateKey = DAILY_RELEASE_DATE_KEYS[index];
    const entry = {
      id,
      dateKey,
      get level(): LevelDefinition {
        return createLevel(index);
      },
    } satisfies DailyEntry;
    entryCache[index] = entry;
    return entry;
  };

  const entries = Array.from({ length: manifest.entryCount }, (_, index) => getEntry(index));
  return {
    length: manifest.entryCount,
    entries,
    createLevel,
    getEntry,
  };
}

import { isSupportedPlayerProfile } from './PlayerProfile';
import type { PlayerProfile, SerializedPuzzleState } from './types';
import { CellState } from '../puzzle/types';

const CLOUD_CODEC_VERSION = 1;
const DAY_MS = 86_400_000;
const MODE_TO_CODE = { campaign: 'c', daily: 'd', tutorial: 't', endless: 'e' } as const;
const CODE_TO_MODE = { c: 'campaign', d: 'daily', t: 'tutorial', e: 'endless' } as const;
const KIND_TO_CODE = { fresh: 'f', retry: 'r', freeplay: 'p' } as const;
const CODE_TO_KIND = { f: 'fresh', r: 'retry', p: 'freeplay' } as const;

type CompactPuzzle = readonly [string, string, string, string, string, string, string];

interface CompactCloudProfile {
  readonly $dl: 1;
  readonly t: readonly [readonly string[], boolean, CompactPuzzle | null];
  readonly c: readonly [readonly string[], string | null, readonly unknown[], readonly unknown[]];
  readonly d: readonly [readonly unknown[], number, number, string | null, number, string, string];
  readonly e: readonly [number, number, string, number, number | null, string | null, CompactPuzzle | null, number, number, number];
  readonly m: number;
  readonly s: readonly [boolean, boolean, string];
  readonly h: readonly [number, number, number | null];
  readonly a: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function encodeNumber(value: number): string {
  return Number.isSafeInteger(value) && value >= 0 ? value.toString(36) : `~${String(value)}`;
}

function decodeNumber(value: unknown): number {
  if (typeof value !== 'string') return 0;
  if (value.startsWith('~')) {
    const parsed = Number(value.slice(1));
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  }
  const parsed = Number.parseInt(value, 36);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function dateToDay(date: string): number {
  const parsed = Date.parse(`${date}T00:00:00.000Z`);
  if (!Number.isFinite(parsed)) throw new Error(`Invalid date ${date}`);
  return Math.floor(parsed / DAY_MS);
}

function dayToDate(day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let start = 0; start < bytes.length; start += chunkSize) {
    const chunk = bytes.subarray(start, Math.min(bytes.length, start + chunkSize));
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function pushVarint(output: number[], value: number): void {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('Varint requires a non-negative safe integer.');
  let remaining = value;
  do {
    const next = remaining % 128;
    remaining = Math.floor(remaining / 128);
    output.push(next + (remaining > 0 ? 128 : 0));
  } while (remaining > 0);
}

function readVarint(bytes: Uint8Array, cursor: { value: number }): number {
  let multiplier = 1;
  let result = 0;
  while (cursor.value < bytes.length) {
    const byte = bytes[cursor.value++]!;
    result += (byte & 0x7f) * multiplier;
    if ((byte & 0x80) === 0) return result;
    multiplier *= 128;
    if (!Number.isSafeInteger(result) || multiplier > Number.MAX_SAFE_INTEGER) break;
  }
  throw new Error('Invalid compact varint.');
}

function encodePuzzle(puzzle: SerializedPuzzleState): CompactPuzzle {
  const lengths = puzzle.cells.map((row) => row.length);
  const cellCodes: number[] = [];
  for (const row of puzzle.cells) {
    for (const cell of row) {
      cellCodes.push(cell === CellState.Wall ? 1 : cell === CellState.Floor ? 2 : 0);
    }
  }
  const bytes = new Uint8Array(Math.ceil(cellCodes.length / 4));
  for (let index = 0; index < cellCodes.length; index += 1) {
    bytes[Math.floor(index / 4)]! |= cellCodes[index]! << ((index % 4) * 2);
  }
  return [
    MODE_TO_CODE[puzzle.mode],
    puzzle.puzzleId,
    lengths.map((length) => length.toString(36)).join('.'),
    bytesToBase64(bytes),
    encodeNumber(puzzle.activePlayMs),
    encodeNumber(puzzle.hintsUsed),
    encodeNumber(puzzle.startedAtMs),
  ];
}

function decodePuzzle(value: unknown): SerializedPuzzleState | null {
  if (!Array.isArray(value) || value.length !== 7) return null;
  const [modeCode, puzzleId, rowLengths, cellData, activePlay, hints, started] = value;
  if (typeof modeCode !== 'string' || !(modeCode in CODE_TO_MODE)) return null;
  if (typeof puzzleId !== 'string' || typeof rowLengths !== 'string' || typeof cellData !== 'string') return null;
  const lengths = rowLengths.split('.').filter((part) => part.length > 0).map((part) => Number.parseInt(part, 36));
  if (lengths.length === 0 || lengths.some((length) => !Number.isInteger(length) || length <= 0)) return null;
  const bytes = base64ToBytes(cellData);
  const cellCount = lengths.reduce((sum, length) => sum + length, 0);
  const flat: (typeof CellState[keyof typeof CellState])[] = [];
  for (let index = 0; index < cellCount; index += 1) {
    const code = ((bytes[Math.floor(index / 4)] ?? 0) >> ((index % 4) * 2)) & 0x03;
    flat.push(code === 1 ? CellState.Wall : code === 2 ? CellState.Floor : CellState.Unknown);
  }
  const cells: (typeof CellState[keyof typeof CellState])[][] = [];
  let cursor = 0;
  for (const length of lengths) {
    cells.push(flat.slice(cursor, cursor + length));
    cursor += length;
  }
  return {
    mode: CODE_TO_MODE[modeCode as keyof typeof CODE_TO_MODE],
    puzzleId,
    cells,
    activePlayMs: decodeNumber(activePlay),
    hintsUsed: Math.floor(decodeNumber(hints)),
    startedAtMs: decodeNumber(started),
  };
}

function encodeDailyResults(profile: PlayerProfile): string {
  const entries = Object.entries(profile.daily.results).sort(([left], [right]) => left.localeCompare(right));
  const bytes: number[] = [];
  let previousDay = 0;
  entries.forEach(([date, result], index) => {
    const day = dateToDay(date);
    const delta = index === 0 ? day : day - previousDay;
    if (delta < 0) throw new Error('Daily results must be sortable by ascending date.');
    if (!Number.isSafeInteger(result.bestTimeMs) || result.bestTimeMs < 0) {
      throw new Error('Daily best time must be a non-negative integer for compact cloud storage.');
    }
    pushVarint(bytes, delta);
    pushVarint(bytes, result.bestTimeMs);
    pushVarint(bytes, result.minHintsUsed * 2 + (result.solvedWithoutHints ? 1 : 0));
    previousDay = day;
  });
  return bytesToBase64(Uint8Array.from(bytes));
}

function decodeDailyResults(value: string): Record<string, { bestTimeMs: number; minHintsUsed: number; solvedWithoutHints: boolean }> {
  const bytes = base64ToBytes(value);
  const cursor = { value: 0 };
  const results: Record<string, { bestTimeMs: number; minHintsUsed: number; solvedWithoutHints: boolean }> = {};
  let previousDay = 0;
  let index = 0;
  while (cursor.value < bytes.length) {
    const delta = readVarint(bytes, cursor);
    const day = index === 0 ? delta : previousDay + delta;
    const bestTimeMs = readVarint(bytes, cursor);
    const hintFlags = readVarint(bytes, cursor);
    results[dayToDate(day)] = {
      bestTimeMs,
      minHintsUsed: Math.floor(hintFlags / 2),
      solvedWithoutHints: (hintFlags & 1) === 1,
    };
    previousDay = day;
    index += 1;
  }
  return results;
}

function encodeSkipped(skipped: readonly number[]): string {
  const validUnique = skipped.every((value) => Number.isSafeInteger(value) && value >= 0)
    && new Set(skipped).size === skipped.length;
  const sorted = validUnique ? [...skipped].sort((left, right) => left - right) : [];
  const headOffset = skipped.length === 0 ? 0 : sorted.indexOf(skipped[0]!);
  const cyclicAscending = validUnique && headOffset >= 0 && skipped.every((value, index) => (
    value === sorted[(headOffset + index) % sorted.length]
  ));

  if (cyclicAscending) {
    const maximum = sorted.at(-1) ?? -1;
    const bits = new Uint8Array(maximum < 0 ? 0 : Math.floor(maximum / 8) + 1);
    for (const index of sorted) bits[Math.floor(index / 8)]! |= 1 << (index % 8);
    const payload = bytesToBase64(bits);
    return headOffset === 0 ? `b:${payload}` : `r:${skipped[0]!.toString(36)}:${payload}`;
  }

  const bytes: number[] = [];
  let previous = 0;
  skipped.forEach((index, position) => {
    if (!Number.isSafeInteger(index) || index < 0) throw new Error('Invalid Endless skipped index.');
    const delta = position === 0 ? index : index - previous;
    const zigZag = delta >= 0 ? delta * 2 : (-delta * 2) - 1;
    pushVarint(bytes, zigZag);
    previous = index;
  });
  return `v:${bytesToBase64(Uint8Array.from(bytes))}`;
}

function decodeSkipped(value: string): number[] {
  if (value.startsWith('b:') || value.startsWith('r:')) {
    const rotated = value.startsWith('r:');
    const separator = rotated ? value.indexOf(':', 2) : -1;
    const head = rotated && separator > 2 ? Number.parseInt(value.slice(2, separator), 36) : null;
    const payload = rotated && separator > 2 ? value.slice(separator + 1) : value.slice(2);
    const bytes = base64ToBytes(payload);
    const skipped: number[] = [];
    for (let byteIndex = 0; byteIndex < bytes.length; byteIndex += 1) {
      const byte = bytes[byteIndex]!;
      if (byte === 0) continue;
      for (let bit = 0; bit < 8; bit += 1) {
        if ((byte & (1 << bit)) !== 0) skipped.push(byteIndex * 8 + bit);
      }
    }
    if (head !== null && Number.isFinite(head)) {
      const headOffset = skipped.indexOf(head);
      if (headOffset < 0) throw new Error('Invalid rotated Endless skipped queue head.');
      return [...skipped.slice(headOffset), ...skipped.slice(0, headOffset)];
    }
    return skipped;
  }

  const payload = value.startsWith('v:') ? value.slice(2) : value;
  const bytes = base64ToBytes(payload);
  const cursor = { value: 0 };
  const skipped: number[] = [];
  let previous = 0;
  while (cursor.value < bytes.length) {
    const zigZag = readVarint(bytes, cursor);
    const delta = (zigZag & 1) === 0 ? zigZag / 2 : -((zigZag + 1) / 2);
    const index = skipped.length === 0 ? delta : previous + delta;
    if (!Number.isSafeInteger(index) || index < 0) throw new Error('Invalid decoded Endless skipped index.');
    skipped.push(index);
    previous = index;
  }
  return skipped;
}

function encodeProfile(profile: PlayerProfile): CompactCloudProfile {
  const dailyResultDates = new Set(Object.keys(profile.daily.results));
  const extraSolvedDays = profile.daily.solvedDates
    .filter((date) => !dailyResultDates.has(date))
    .map((date) => dateToDay(date).toString(36))
    .join('.');

  return {
    $dl: CLOUD_CODEC_VERSION,
    t: [profile.tutorial.completedLevelIds, profile.tutorial.completed, profile.tutorial.activePuzzle === null ? null : encodePuzzle(profile.tutorial.activePuzzle)],
    c: [
      profile.campaign.completedLevelIds,
      profile.campaign.lastPlayedLevelId,
      Object.entries(profile.campaign.levelResults).map(([id, result]) => [id, encodeNumber(result.bestTimeMs), result.minHintsUsed, result.solveCount, result.solvedWithoutHints]),
      Object.entries(profile.campaign.drafts).map(([id, puzzle]) => [id, encodePuzzle(puzzle)]),
    ],
    d: [
      Object.entries(profile.daily.drafts).map(([date, puzzle]) => [dateToDay(date).toString(36), encodePuzzle(puzzle)]),
      profile.daily.currentStreak,
      profile.daily.bestStreak,
      profile.daily.lastSolvedDate === null ? null : dateToDay(profile.daily.lastSolvedDate).toString(36),
      profile.daily.totalSolved,
      extraSolvedDays,
      encodeDailyResults(profile),
    ],
    e: [
      profile.endless.nextFreshIndex,
      profile.endless.completed,
      encodeSkipped(profile.endless.skipped),
      profile.endless.freshSolvesSinceRetry,
      profile.endless.activeCatalogIndex,
      profile.endless.activeKind === null ? null : KIND_TO_CODE[profile.endless.activeKind],
      profile.endless.activePuzzle === null ? null : encodePuzzle(profile.endless.activePuzzle),
      profile.endless.currentStreak,
      profile.endless.bestStreak,
      profile.endless.freePlayOrdinal,
    ],
    m: profile.mastery.rating,
    s: [profile.settings.musicEnabled, profile.settings.soundEnabled, profile.settings.language],
    h: [profile.hints.freeRemaining, profile.hints.totalUsed, profile.hints.rechargeAnchorMs ?? null],
    a: profile.totals.activePlayMs,
  };
}

function decodeProfile(raw: CompactCloudProfile): PlayerProfile {
  const campaignResults: Record<string, PlayerProfile['campaign']['levelResults'][string]> = {};
  for (const item of raw.c[2]) {
    if (!Array.isArray(item) || item.length !== 5 || typeof item[0] !== 'string') continue;
    campaignResults[item[0]] = {
      bestTimeMs: decodeNumber(item[1]),
      minHintsUsed: typeof item[2] === 'number' ? item[2] : 0,
      solveCount: typeof item[3] === 'number' ? item[3] : 0,
      solvedWithoutHints: item[4] === true,
    };
  }
  const campaignDrafts: Record<string, SerializedPuzzleState> = {};
  for (const item of raw.c[3]) {
    if (!Array.isArray(item) || item.length !== 2 || typeof item[0] !== 'string') continue;
    const puzzle = decodePuzzle(item[1]);
    if (puzzle !== null) campaignDrafts[item[0]] = puzzle;
  }

  const dailyDrafts: Record<string, SerializedPuzzleState> = {};
  for (const item of raw.d[0]) {
    if (!Array.isArray(item) || item.length !== 2 || typeof item[0] !== 'string') continue;
    const day = Number.parseInt(item[0], 36);
    const puzzle = decodePuzzle(item[1]);
    if (Number.isFinite(day) && puzzle !== null) dailyDrafts[dayToDate(day)] = puzzle;
  }
  const dailyResults = decodeDailyResults(raw.d[6]);
  const solvedSet = new Set(Object.keys(dailyResults));
  if (raw.d[5].length > 0) {
    for (const part of raw.d[5].split('.')) {
      const day = Number.parseInt(part, 36);
      if (Number.isFinite(day)) solvedSet.add(dayToDate(day));
    }
  }
  const lastSolvedDay = raw.d[3] === null ? null : Number.parseInt(raw.d[3], 36);

  const tutorialPuzzle = decodePuzzle(raw.t[2]);
  const endlessPuzzle = decodePuzzle(raw.e[6]);
  const kindCode = raw.e[5];
  return {
    schemaVersion: 1,
    tutorial: {
      completedLevelIds: [...raw.t[0]],
      completed: raw.t[1] === true,
      activePuzzle: tutorialPuzzle,
    },
    campaign: {
      completedLevelIds: [...raw.c[0]],
      lastPlayedLevelId: raw.c[1],
      levelResults: campaignResults,
      drafts: campaignDrafts,
    },
    daily: {
      drafts: dailyDrafts,
      currentStreak: raw.d[1],
      bestStreak: raw.d[2],
      lastSolvedDate: lastSolvedDay === null || !Number.isFinite(lastSolvedDay) ? null : dayToDate(lastSolvedDay),
      totalSolved: raw.d[4],
      solvedDates: [...solvedSet].sort(),
      results: dailyResults,
    },
    endless: {
      nextFreshIndex: raw.e[0],
      completed: raw.e[1],
      skipped: decodeSkipped(raw.e[2]),
      freshSolvesSinceRetry: raw.e[3],
      activeCatalogIndex: raw.e[4],
      activeKind: typeof kindCode === 'string' && kindCode in CODE_TO_KIND
        ? CODE_TO_KIND[kindCode as keyof typeof CODE_TO_KIND]
        : null,
      activePuzzle: endlessPuzzle,
      currentStreak: raw.e[7],
      bestStreak: raw.e[8],
      freePlayOrdinal: raw.e[9],
    },
    mastery: { rating: raw.m },
    settings: {
      musicEnabled: raw.s[0],
      soundEnabled: raw.s[1],
      language: raw.s[2] as PlayerProfile['settings']['language'],
    },
    hints: {
      freeRemaining: raw.h[0],
      totalUsed: raw.h[1],
      rechargeAnchorMs: raw.h[2],
    },
    totals: { activePlayMs: raw.a },
  };
}

function isCompactCloudProfile(value: unknown): value is CompactCloudProfile {
  return isRecord(value)
    && value.$dl === CLOUD_CODEC_VERSION
    && Array.isArray(value.t)
    && Array.isArray(value.c)
    && Array.isArray(value.d)
    && Array.isArray(value.e)
    && typeof value.m === 'number'
    && Array.isArray(value.s)
    && Array.isArray(value.h)
    && typeof value.a === 'number';
}

export function encodeCloudPlayerProfile(value: unknown): unknown {
  if (!isSupportedPlayerProfile(value)) return value;
  try {
    return encodeProfile(value as unknown as PlayerProfile);
  } catch (error) {
    console.warn('[Dungeon Logic] Could not compact cloud profile; falling back to current schema.', error);
    return value;
  }
}

export function decodeCloudPlayerProfile(value: unknown): unknown {
  if (!isCompactCloudProfile(value)) return value;
  try {
    return decodeProfile(value);
  } catch (error) {
    console.warn('[Dungeon Logic] Could not decode compact cloud profile.', error);
    return null;
  }
}

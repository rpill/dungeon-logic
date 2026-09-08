import type { CampaignLevelEntry } from '../content/campaign/types';
import { CellState } from '../puzzle/types';
import type { CampaignProgressV1 } from '../campaign/types';
import type {
  CampaignLevelResult,
  DailyProfileState,
  DailyResultSummary,
  PlayerProfileV1,
  PlayerSettings,
  SerializedPuzzleState,
} from './types';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const VALID_CELL_STATES = new Set<string>([
  CellState.Unknown,
  CellState.Wall,
  CellState.Floor,
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonNegativeInteger(value: unknown, fallback = 0): number {
  return Number.isInteger(value) && typeof value === 'number' && value >= 0
    ? value
    : fallback;
}

function nonNegativeFinite(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : fallback;
}

function nullableTimestamp(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : null;
}

function normalizeCampaignLevelResult(value: unknown): CampaignLevelResult | null {
  if (!isRecord(value)) return null;

  const bestTimeMs = nonNegativeFinite(value.bestTimeMs, -1);
  const minHintsUsed = nonNegativeInteger(value.minHintsUsed, -1);
  const solveCount = nonNegativeInteger(value.solveCount, -1);
  if (bestTimeMs < 0 || minHintsUsed < 0 || solveCount <= 0) return null;
  if (typeof value.solvedWithoutHints !== 'boolean') return null;

  return {
    bestTimeMs,
    minHintsUsed,
    solveCount,
    solvedWithoutHints: value.solvedWithoutHints,
  };
}

function normalizeDailyResult(value: unknown): DailyResultSummary | null {
  if (!isRecord(value)) return null;

  const bestTimeMs = nonNegativeFinite(value.bestTimeMs, -1);
  const minHintsUsed = nonNegativeInteger(value.minHintsUsed, -1);
  if (bestTimeMs < 0 || minHintsUsed < 0) return null;
  if (typeof value.solvedWithoutHints !== 'boolean') return null;

  return {
    bestTimeMs,
    minHintsUsed,
    solvedWithoutHints: value.solvedWithoutHints,
  };
}

function normalizeSerializedPuzzleState(
  value: unknown,
  knownCampaignIds: ReadonlySet<string>,
): SerializedPuzzleState | null {
  if (!isRecord(value)) return null;
  if (value.mode !== 'campaign' && value.mode !== 'daily') return null;
  if (typeof value.puzzleId !== 'string' || value.puzzleId.length === 0) return null;
  if (value.mode === 'campaign' && !knownCampaignIds.has(value.puzzleId)) return null;
  if (!Array.isArray(value.cells) || value.cells.length === 0) return null;

  const cells: string[][] = [];
  for (const rawRow of value.cells) {
    if (!Array.isArray(rawRow) || rawRow.length === 0) return null;
    const row: string[] = [];
    for (const cell of rawRow) {
      if (typeof cell !== 'string' || !VALID_CELL_STATES.has(cell)) return null;
      row.push(cell);
    }
    cells.push(row);
  }

  const activePlayMs = nonNegativeFinite(value.activePlayMs, -1);
  const hintsUsed = nonNegativeInteger(value.hintsUsed, -1);
  const startedAtMs = nonNegativeFinite(value.startedAtMs, -1);
  if (activePlayMs < 0 || hintsUsed < 0 || startedAtMs < 0) return null;

  return {
    mode: value.mode,
    puzzleId: value.puzzleId,
    cells: cells as SerializedPuzzleState['cells'],
    activePlayMs,
    hintsUsed,
    startedAtMs,
  };
}

function normalizeSettings(value: unknown): PlayerSettings {
  const raw = isRecord(value) ? value : {};
  return {
    musicEnabled: typeof raw.musicEnabled === 'boolean' ? raw.musicEnabled : true,
    soundEnabled: typeof raw.soundEnabled === 'boolean' ? raw.soundEnabled : true,
    vibrationEnabled: typeof raw.vibrationEnabled === 'boolean' ? raw.vibrationEnabled : true,
    language: typeof raw.language === 'string' && raw.language.length > 0 ? raw.language : 'ru',
  };
}

function normalizeDaily(value: unknown): DailyProfileState {
  const raw = isRecord(value) ? value : {};
  const solvedDates = Array.isArray(raw.solvedDates)
    ? [...new Set(raw.solvedDates.filter(
      (date): date is string => typeof date === 'string' && DATE_PATTERN.test(date),
    ))].sort()
    : [];

  const results: Record<string, DailyResultSummary> = {};
  if (isRecord(raw.results)) {
    for (const [date, candidate] of Object.entries(raw.results)) {
      if (!DATE_PATTERN.test(date)) continue;
      const result = normalizeDailyResult(candidate);
      if (result !== null) results[date] = result;
    }
  }

  const lastSolvedDate = typeof raw.lastSolvedDate === 'string' && DATE_PATTERN.test(raw.lastSolvedDate)
    ? raw.lastSolvedDate
    : null;

  return {
    currentStreak: nonNegativeInteger(raw.currentStreak),
    bestStreak: nonNegativeInteger(raw.bestStreak),
    lastSolvedDate,
    totalSolved: nonNegativeInteger(raw.totalSolved),
    solvedDates,
    results,
  };
}

export function createFreshPlayerProfile(
  _manifest: readonly CampaignLevelEntry[] = [],
): PlayerProfileV1 {
  return {
    schemaVersion: 1,
    campaign: {
      completedLevelIds: [],
      lastPlayedLevelId: null,
      levelResults: {},
      activePuzzle: null,
    },
    daily: {
      currentStreak: 0,
      bestStreak: 0,
      lastSolvedDate: null,
      totalSolved: 0,
      solvedDates: [],
      results: {},
    },
    settings: {
      musicEnabled: true,
      soundEnabled: true,
      vibrationEnabled: true,
      language: 'ru',
    },
    hints: {
      freeRemaining: 3,
      totalUsed: 0,
    },
    ads: {
      campaignCompletionsSinceOpportunity: 0,
      lastInterstitialAtMs: null,
    },
    totals: {
      activePlayMs: 0,
    },
  };
}

export function normalizePlayerProfile(
  raw: unknown,
  manifest: readonly CampaignLevelEntry[],
): PlayerProfileV1 {
  if (!isRecord(raw) || raw.schemaVersion !== 1) {
    return createFreshPlayerProfile(manifest);
  }

  const fresh = createFreshPlayerProfile(manifest);
  const knownIds = new Set(manifest.map((entry) => entry.id));
  const rawCampaign = isRecord(raw.campaign) ? raw.campaign : {};
  const completedSet = new Set(
    Array.isArray(rawCampaign.completedLevelIds)
      ? rawCampaign.completedLevelIds.filter(
        (id): id is string => typeof id === 'string' && knownIds.has(id),
      )
      : [],
  );
  const completedLevelIds = manifest
    .filter((entry) => completedSet.has(entry.id))
    .map((entry) => entry.id);

  const lastPlayedLevelId = typeof rawCampaign.lastPlayedLevelId === 'string'
    && knownIds.has(rawCampaign.lastPlayedLevelId)
    ? rawCampaign.lastPlayedLevelId
    : null;

  const levelResults: Record<string, CampaignLevelResult> = {};
  if (isRecord(rawCampaign.levelResults)) {
    for (const entry of manifest) {
      const result = normalizeCampaignLevelResult(rawCampaign.levelResults[entry.id]);
      if (result !== null) levelResults[entry.id] = result;
    }
  }

  const rawHints = isRecord(raw.hints) ? raw.hints : {};
  const rawAds = isRecord(raw.ads) ? raw.ads : {};
  const rawTotals = isRecord(raw.totals) ? raw.totals : {};

  return {
    schemaVersion: 1,
    campaign: {
      completedLevelIds,
      lastPlayedLevelId,
      levelResults,
      activePuzzle: normalizeSerializedPuzzleState(rawCampaign.activePuzzle, knownIds),
    },
    daily: normalizeDaily(raw.daily),
    settings: normalizeSettings(raw.settings),
    hints: {
      freeRemaining: nonNegativeInteger(rawHints.freeRemaining, fresh.hints.freeRemaining),
      totalUsed: nonNegativeInteger(rawHints.totalUsed),
    },
    ads: {
      campaignCompletionsSinceOpportunity: nonNegativeInteger(rawAds.campaignCompletionsSinceOpportunity),
      lastInterstitialAtMs: nullableTimestamp(rawAds.lastInterstitialAtMs),
    },
    totals: {
      activePlayMs: nonNegativeFinite(rawTotals.activePlayMs),
    },
  };
}

function looksLikeLegacyCampaignProgress(value: unknown): value is CampaignProgressV1 {
  if (!isRecord(value)) return false;
  return value.schemaVersion === 1
    && Number.isInteger(value.highestUnlockedSlot)
    && Array.isArray(value.completedLevelIds)
    && value.completedLevelIds.every((id) => typeof id === 'string')
    && (value.lastPlayedLevelId === null || typeof value.lastPlayedLevelId === 'string');
}

export function migrateLegacyCampaignProgress(
  legacy: unknown,
  manifest: readonly CampaignLevelEntry[],
): PlayerProfileV1 {
  const fresh = createFreshPlayerProfile(manifest);
  if (!looksLikeLegacyCampaignProgress(legacy)) return fresh;

  return normalizePlayerProfile({
    ...fresh,
    campaign: {
      ...fresh.campaign,
      completedLevelIds: legacy.completedLevelIds,
      lastPlayedLevelId: legacy.lastPlayedLevelId,
    },
  }, manifest);
}

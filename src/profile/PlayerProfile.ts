import type { CampaignLevelEntry } from '../content/campaign/types';
import { isSupportedLanguage, type SupportedLanguage } from '../i18n/Language';
import { MASTER_RATING_BASE } from '../mastery/MasterRating';
import { CellState } from '../puzzle/types';
import type {
  CampaignLevelResult,
  DailyProfileState,
  DailyResultSummary,
  PlayerProfile,
  PlayerSettings,
  SerializedPuzzleState,
  TutorialProfileState,
} from './types';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const VALID_CELL_STATES = new Set<string>([
  CellState.Unknown,
  CellState.Wall,
  CellState.Floor,
]);
const TUTORIAL_IDS = [
  'tutorial-001',
  'tutorial-002',
  'tutorial-003',
  'tutorial-004',
  'tutorial-005',
] as const;
const KNOWN_TUTORIAL_IDS = new Set<string>(TUTORIAL_IDS);

type PersistedPuzzleMode = SerializedPuzzleState['mode'];

type CurrentProfileEnvelope = Record<string, unknown> & {
  readonly schemaVersion: 1;
  readonly tutorial: Record<string, unknown>;
  readonly campaign: Record<string, unknown>;
  readonly daily: Record<string, unknown>;
  readonly endless: Record<string, unknown>;
  readonly mastery?: unknown;
  readonly settings: Record<string, unknown>;
  readonly hints: Record<string, unknown>;
  readonly ads: Record<string, unknown>;
  readonly totals: Record<string, unknown>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isSupportedPlayerProfile(value: unknown): value is CurrentProfileEnvelope {
  if (!isRecord(value) || value.schemaVersion !== 1) return false;
  return isRecord(value.tutorial)
    && isRecord(value.campaign)
    && isRecord(value.daily)
    && isRecord(value.endless)
    && isRecord(value.settings)
    && isRecord(value.hints)
    && isRecord(value.ads)
    && isRecord(value.totals);
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
  expectedMode: PersistedPuzzleMode,
  knownIds?: ReadonlySet<string>,
): SerializedPuzzleState | null {
  if (!isRecord(value)) return null;
  if (value.mode !== expectedMode) return null;
  if (typeof value.puzzleId !== 'string' || value.puzzleId.length === 0) return null;
  if (knownIds !== undefined && !knownIds.has(value.puzzleId)) return null;
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
    mode: expectedMode,
    puzzleId: value.puzzleId,
    cells: cells as SerializedPuzzleState['cells'],
    activePlayMs,
    hintsUsed,
    startedAtMs,
  };
}

function normalizeSettings(
  value: unknown,
  defaultLanguage: SupportedLanguage,
): PlayerSettings {
  const raw = isRecord(value) ? value : {};
  return {
    musicEnabled: typeof raw.musicEnabled === 'boolean' ? raw.musicEnabled : true,
    soundEnabled: typeof raw.soundEnabled === 'boolean' ? raw.soundEnabled : true,
    language: isSupportedLanguage(raw.language) ? raw.language : defaultLanguage,
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

  const drafts: Record<string, SerializedPuzzleState> = {};
  if (isRecord(raw.drafts)) {
    for (const [dateKey, candidate] of Object.entries(raw.drafts)) {
      if (!DATE_PATTERN.test(dateKey) || results[dateKey] !== undefined) continue;
      const draft = normalizeSerializedPuzzleState(candidate, 'daily');
      if (draft !== null) drafts[dateKey] = draft;
    }
  }

  return {
    drafts,
    currentStreak: nonNegativeInteger(raw.currentStreak),
    bestStreak: nonNegativeInteger(raw.bestStreak),
    lastSolvedDate,
    totalSolved: nonNegativeInteger(raw.totalSolved),
    solvedDates,
    results,
  };
}

function normalizeEndless(value: unknown): PlayerProfile['endless'] {
  const raw = isRecord(value) ? value : {};
  const rawCompleted = nonNegativeInteger(raw.completed);
  const nextFreshIndex = Math.max(
    rawCompleted,
    nonNegativeInteger(raw.nextFreshIndex, rawCompleted),
  );
  const completed = Math.min(rawCompleted, nextFreshIndex);
  const skipped = Array.isArray(raw.skipped)
    ? [...new Set(raw.skipped
      .filter((value): value is number => Number.isInteger(value) && typeof value === 'number' && value >= 0 && value < nextFreshIndex))]
    : [];
  const rawActiveCatalogIndex = nonNegativeInteger(raw.activeCatalogIndex, -1);
  const activeCatalogIndex = rawActiveCatalogIndex >= 0 ? rawActiveCatalogIndex : null;
  const activeKind = raw.activeKind === 'fresh' || raw.activeKind === 'retry' || raw.activeKind === 'freeplay'
    ? raw.activeKind
    : null;
  const hasActiveSelection = activeCatalogIndex !== null && activeKind !== null;
  const activePuzzle = hasActiveSelection
    ? normalizeSerializedPuzzleState(raw.activePuzzle, 'endless')
    : null;
  const currentStreak = nonNegativeInteger(raw.currentStreak);
  const bestStreak = Math.max(
    currentStreak,
    nonNegativeInteger(raw.bestStreak),
  );

  return {
    nextFreshIndex,
    completed,
    skipped,
    freshSolvesSinceRetry: nonNegativeInteger(raw.freshSolvesSinceRetry),
    activeCatalogIndex: hasActiveSelection ? activeCatalogIndex : null,
    activeKind: hasActiveSelection ? activeKind : null,
    activePuzzle,
    currentStreak,
    bestStreak,
    freePlayOrdinal: nonNegativeInteger(raw.freePlayOrdinal),
  };
}

function normalizeMastery(value: unknown): PlayerProfile['mastery'] {
  const raw = isRecord(value) ? value : {};
  return {
    rating: nonNegativeInteger(raw.rating, MASTER_RATING_BASE),
  };
}

function normalizeTutorial(value: unknown): TutorialProfileState {
  const raw = isRecord(value) ? value : {};
  const persistedCompleted = raw.completed === true;
  const completedSet = new Set(
    Array.isArray(raw.completedLevelIds)
      ? raw.completedLevelIds.filter(
        (id): id is string => typeof id === 'string' && KNOWN_TUTORIAL_IDS.has(id),
      )
      : [],
  );
  const completedLevelIds = persistedCompleted
    ? [...TUTORIAL_IDS]
    : TUTORIAL_IDS.filter((id) => completedSet.has(id));

  return {
    completedLevelIds,
    completed: persistedCompleted || completedLevelIds.length === TUTORIAL_IDS.length,
    activePuzzle: normalizeSerializedPuzzleState(
      raw.activePuzzle,
      'tutorial',
      KNOWN_TUTORIAL_IDS,
    ),
  };
}

export function createFreshPlayerProfile(
  _manifest: readonly CampaignLevelEntry[] = [],
  defaultLanguage: SupportedLanguage = 'ru',
): PlayerProfile {
  return {
    schemaVersion: 1,
    tutorial: {
      completedLevelIds: [],
      completed: false,
      activePuzzle: null,
    },
    campaign: {
      completedLevelIds: [],
      lastPlayedLevelId: null,
      levelResults: {},
      drafts: {},
    },
    daily: {
      drafts: {},
      currentStreak: 0,
      bestStreak: 0,
      lastSolvedDate: null,
      totalSolved: 0,
      solvedDates: [],
      results: {},
    },
    endless: {
      nextFreshIndex: 0,
      completed: 0,
      skipped: [],
      freshSolvesSinceRetry: 0,
      activeCatalogIndex: null,
      activeKind: null,
      activePuzzle: null,
      currentStreak: 0,
      bestStreak: 0,
      freePlayOrdinal: 0,
    },
    mastery: {
      rating: MASTER_RATING_BASE,
    },
    settings: {
      musicEnabled: true,
      soundEnabled: true,
      language: defaultLanguage,
    },
    hints: {
      freeRemaining: 3,
      totalUsed: 0,
      rechargeAnchorMs: null,
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
  defaultLanguage: SupportedLanguage = 'ru',
): PlayerProfile {
  if (!isSupportedPlayerProfile(raw)) {
    return createFreshPlayerProfile(manifest, defaultLanguage);
  }

  const fresh = createFreshPlayerProfile(manifest, defaultLanguage);
  const knownIds = new Set(manifest.map((entry) => entry.id));
  const rawCampaign = raw.campaign;
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

  const campaignDrafts: Record<string, SerializedPuzzleState> = {};
  if (isRecord(rawCampaign.drafts)) {
    for (const [levelId, candidate] of Object.entries(rawCampaign.drafts)) {
      if (!knownIds.has(levelId)) continue;
      const draft = normalizeSerializedPuzzleState(candidate, 'campaign', knownIds);
      if (draft !== null && draft.puzzleId === levelId) campaignDrafts[levelId] = draft;
    }
  }

  const rawHints = raw.hints;
  const rawAds = raw.ads;
  const rawTotals = raw.totals;

  return {
    schemaVersion: 1,
    tutorial: normalizeTutorial(raw.tutorial),
    campaign: {
      completedLevelIds,
      lastPlayedLevelId,
      levelResults,
      drafts: campaignDrafts,
    },
    daily: normalizeDaily(raw.daily),
    endless: normalizeEndless(raw.endless),
    mastery: normalizeMastery(raw.mastery),
    settings: normalizeSettings(raw.settings, defaultLanguage),
    hints: {
      freeRemaining: Math.min(3, nonNegativeInteger(rawHints.freeRemaining, fresh.hints.freeRemaining)),
      totalUsed: nonNegativeInteger(rawHints.totalUsed),
      rechargeAnchorMs: nullableTimestamp(rawHints.rechargeAnchorMs),
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

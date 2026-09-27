import type { CampaignLevelEntry } from '../content/campaign/types';
import type { SupportedLanguage } from '../i18n/Language';
import { createFreshPlayerProfile, normalizePlayerProfile } from './PlayerProfile';
import type {
  CampaignLevelResult,
  DailyResultSummary,
  PlayerProfile,
  SerializedPuzzleState,
} from './types';

function latestPuzzle(
  target: SerializedPuzzleState | null | undefined,
  source: SerializedPuzzleState | null | undefined,
): SerializedPuzzleState | null {
  if (target === undefined || target === null) return source ?? null;
  if (source === undefined || source === null) return target;
  return source.startedAtMs >= target.startedAtMs ? source : target;
}

function mergePuzzleMap(
  target: Readonly<Record<string, SerializedPuzzleState>>,
  source: Readonly<Record<string, SerializedPuzzleState>>,
): Record<string, SerializedPuzzleState> {
  const merged: Record<string, SerializedPuzzleState> = {};
  for (const key of new Set([...Object.keys(target), ...Object.keys(source)])) {
    const next = latestPuzzle(target[key], source[key]);
    if (next !== null) merged[key] = next;
  }
  return merged;
}

function mergeCampaignResult(
  target: CampaignLevelResult | undefined,
  source: CampaignLevelResult | undefined,
): CampaignLevelResult | undefined {
  if (target === undefined) return source;
  if (source === undefined) return target;
  return {
    bestTimeMs: Math.min(target.bestTimeMs, source.bestTimeMs),
    minHintsUsed: Math.min(target.minHintsUsed, source.minHintsUsed),
    solveCount: Math.max(target.solveCount, source.solveCount),
    solvedWithoutHints: target.solvedWithoutHints || source.solvedWithoutHints,
  };
}

function mergeDailyResult(
  target: DailyResultSummary | undefined,
  source: DailyResultSummary | undefined,
): DailyResultSummary | undefined {
  if (target === undefined) return source;
  if (source === undefined) return target;
  return {
    bestTimeMs: Math.min(target.bestTimeMs, source.bestTimeMs),
    minHintsUsed: Math.min(target.minHintsUsed, source.minHintsUsed),
    solvedWithoutHints: target.solvedWithoutHints || source.solvedWithoutHints,
  };
}

function laterDate(left: string | null, right: string | null): string | null {
  if (left === null) return right;
  if (right === null) return left;
  return left >= right ? left : right;
}

function currentDailyStreak(target: PlayerProfile, source: PlayerProfile): number {
  const targetDate = target.daily.lastSolvedDate;
  const sourceDate = source.daily.lastSolvedDate;
  if (targetDate === sourceDate) return Math.max(target.daily.currentStreak, source.daily.currentStreak);
  if (targetDate === null) return source.daily.currentStreak;
  if (sourceDate === null) return target.daily.currentStreak;
  return sourceDate > targetDate ? source.daily.currentStreak : target.daily.currentStreak;
}

function endlessProgressTuple(profile: PlayerProfile): readonly number[] {
  return [
    profile.endless.completed,
    profile.endless.nextFreshIndex,
    profile.endless.freePlayOrdinal,
  ];
}

function sourceHasAtLeastAsMuchEndlessProgress(target: PlayerProfile, source: PlayerProfile): boolean {
  const targetTuple = endlessProgressTuple(target);
  const sourceTuple = endlessProgressTuple(source);
  for (let index = 0; index < targetTuple.length; index += 1) {
    if (sourceTuple[index] === targetTuple[index]) continue;
    return sourceTuple[index] > targetTuple[index];
  }
  return true;
}

function maxNullableTimestamp(left: number | null, right: number | null): number | null {
  if (left === null) return right;
  if (right === null) return left;
  return Math.max(left, right);
}

/**
 * Merges a currently active device/guest profile (`sourceRaw`) into an account/cloud
 * profile (`targetRaw`) without additive counters. The operation is intentionally
 * idempotent so a retried authorization cannot inflate progress.
 */
export function mergePlayerProfiles(
  targetRaw: unknown,
  sourceRaw: unknown,
  manifest: readonly CampaignLevelEntry[],
  defaultLanguage: SupportedLanguage = 'ru',
): PlayerProfile {
  const target = targetRaw === null || targetRaw === undefined
    ? createFreshPlayerProfile(manifest, defaultLanguage)
    : normalizePlayerProfile(targetRaw, manifest, defaultLanguage);
  const source = normalizePlayerProfile(sourceRaw, manifest, defaultLanguage);

  const completedSet = new Set([
    ...target.campaign.completedLevelIds,
    ...source.campaign.completedLevelIds,
  ]);
  const completedLevelIds = manifest
    .filter((entry) => completedSet.has(entry.id))
    .map((entry) => entry.id);

  const levelResults: Record<string, CampaignLevelResult> = {};
  for (const entry of manifest) {
    const result = mergeCampaignResult(
      target.campaign.levelResults[entry.id],
      source.campaign.levelResults[entry.id],
    );
    if (result !== undefined) levelResults[entry.id] = result;
  }

  const solvedDates = [...new Set([
    ...target.daily.solvedDates,
    ...source.daily.solvedDates,
  ])].sort();
  const dailyResults: Record<string, DailyResultSummary> = {};
  for (const dateKey of new Set([
    ...Object.keys(target.daily.results),
    ...Object.keys(source.daily.results),
  ])) {
    const result = mergeDailyResult(target.daily.results[dateKey], source.daily.results[dateKey]);
    if (result !== undefined) dailyResults[dateKey] = result;
  }

  const tutorialCompleted = new Set([
    ...target.tutorial.completedLevelIds,
    ...source.tutorial.completedLevelIds,
  ]);
  const baseEndless = sourceHasAtLeastAsMuchEndlessProgress(target, source)
    ? source.endless
    : target.endless;

  const merged: PlayerProfile = {
    schemaVersion: 1,
    tutorial: {
      completedLevelIds: [...tutorialCompleted],
      completed: target.tutorial.completed || source.tutorial.completed,
      activePuzzle: latestPuzzle(target.tutorial.activePuzzle, source.tutorial.activePuzzle),
    },
    campaign: {
      completedLevelIds,
      lastPlayedLevelId: source.campaign.lastPlayedLevelId ?? target.campaign.lastPlayedLevelId,
      levelResults,
      drafts: mergePuzzleMap(target.campaign.drafts, source.campaign.drafts),
    },
    daily: {
      drafts: mergePuzzleMap(target.daily.drafts, source.daily.drafts),
      currentStreak: currentDailyStreak(target, source),
      bestStreak: Math.max(target.daily.bestStreak, source.daily.bestStreak),
      lastSolvedDate: laterDate(target.daily.lastSolvedDate, source.daily.lastSolvedDate),
      totalSolved: Math.max(target.daily.totalSolved, source.daily.totalSolved, solvedDates.length),
      solvedDates,
      results: dailyResults,
    },
    endless: {
      ...baseEndless,
      bestStreak: Math.max(target.endless.bestStreak, source.endless.bestStreak),
      freePlayOrdinal: Math.max(target.endless.freePlayOrdinal, source.endless.freePlayOrdinal),
    },
    mastery: {
      rating: Math.max(target.mastery.rating, source.mastery.rating),
    },
    settings: source.settings,
    hints: {
      freeRemaining: source.hints.freeRemaining,
      totalUsed: Math.max(target.hints.totalUsed, source.hints.totalUsed),
      rechargeAnchorMs: source.hints.rechargeAnchorMs ?? null,
    },
    ads: {
      campaignCompletionsSinceOpportunity: source.ads.campaignCompletionsSinceOpportunity,
      lastInterstitialAtMs: maxNullableTimestamp(
        target.ads.lastInterstitialAtMs,
        source.ads.lastInterstitialAtMs,
      ),
    },
    totals: {
      activePlayMs: Math.max(target.totals.activePlayMs, source.totals.activePlayMs),
    },
  };

  return normalizePlayerProfile(merged, manifest, defaultLanguage);
}

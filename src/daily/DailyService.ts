import type { GameAnalyticsAttempt } from '../campaign/types';
import type { DailyEntry } from '../content/daily/types';
import { PuzzleSessionState, isCompatiblePuzzleSnapshot } from '../gameplay/PuzzleSessionState';
import { DAILY_MASTER_RATING_REWARD } from '../mastery/MasterRating';
import type { TrustedClock } from '../platform/services';
import type { PlayerProfileService } from '../profile/PlayerProfileService';
import type { DailyProfileState, DailyResultSummary } from '../profile/types';
import { findDailyForDate, toUtcDateKey } from './DailySelector';

export const DAILY_SERVICE_REGISTRY_KEY = 'daily-service';

const UTC_DAY_MS = 24 * 60 * 60 * 1000;

export interface RecentDailyHistoryDay {
  readonly dateKey: string;
  readonly solved: boolean;
  readonly isToday: boolean;
}

export function getRecentDailyHistory(
  todayDateKey: string,
  solvedDates: readonly string[],
  dayCount = 7,
): readonly RecentDailyHistoryDay[] {
  const [year, month, day] = todayDateKey.split('-').map(Number);
  const todayMs = Date.UTC(year, month - 1, day);
  const count = Math.max(1, Math.floor(dayCount));
  const solved = new Set(solvedDates);

  return Array.from({ length: count }, (_, index) => {
    const daysAgo = count - index - 1;
    const dateKey = toUtcDateKey(new Date(todayMs - daysAgo * UTC_DAY_MS));
    return {
      dateKey,
      solved: solved.has(dateKey),
      isToday: dateKey === todayDateKey,
    };
  });
}

function previousUtcDateKey(date: Date): string {
  const utcMidnightMs = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );
  return toUtcDateKey(new Date(utcMidnightMs - UTC_DAY_MS));
}

export interface DailyTodaySnapshot {
  readonly dateKey: string;
  readonly entry: DailyEntry | null;
  readonly currentStreak: number;
  readonly bestStreak: number;
  readonly totalSolved: number;
  readonly solved: boolean;
  readonly result: DailyResultSummary | null;
}

export interface DailyArchiveEntry {
  readonly dateKey: string;
  readonly entry: DailyEntry;
  readonly ranked: false;
  readonly archive: true;
  readonly solved: boolean;
  readonly result: DailyResultSummary | null;
}

export interface DailyAttemptLaunch {
  readonly dateKey: string;
  readonly entry: DailyEntry;
  readonly ranked: boolean;
  readonly archive: boolean;
  readonly elapsedMsAtLaunch: number;
  readonly attempt: GameAnalyticsAttempt;
}

export interface DailyCompletionResult {
  readonly dailyId: string;
  readonly dateKey: string;
  readonly wasFirstSolve: boolean;
  readonly ranked: boolean;
  readonly archive: boolean;
  readonly currentStreak: number;
  readonly bestStreak: number;
  readonly totalSolved: number;
  readonly result: DailyResultSummary;
  readonly persisted: boolean;
}

export class DailyService {
  private readonly entries: readonly DailyEntry[];
  private readonly profileService: PlayerProfileService;
  private readonly clock: TrustedClock;

  private constructor(
    entries: readonly DailyEntry[],
    profileService: PlayerProfileService,
    clock: TrustedClock,
  ) {
    this.entries = entries;
    this.profileService = profileService;
    this.clock = clock;
  }

  static create(
    entries: readonly DailyEntry[],
    profileService: PlayerProfileService,
    clock: TrustedClock,
  ): DailyService {
    return new DailyService(entries, profileService, clock);
  }

  getEntries(): readonly DailyEntry[] {
    return this.entries;
  }

  getHistory(): DailyProfileState {
    return this.profileService.getProfile().daily;
  }

  async getToday(): Promise<DailyTodaySnapshot | null> {
    const trustedNow = await this.clock.now();
    if (trustedNow === null) return null;

    const dateKey = toUtcDateKey(trustedNow);
    const entry = findDailyForDate(this.entries, trustedNow);
    const previousDateKey = previousUtcDateKey(trustedNow);
    const previousDateIsScheduled = this.entries.some((candidate) => candidate.dateKey === previousDateKey);
    const daily = this.getHistory();
    const currentStreak = entry !== null && (
      daily.lastSolvedDate === dateKey
      || (previousDateIsScheduled && daily.lastSolvedDate === previousDateKey)
    )
      ? daily.currentStreak
      : 0;

    return {
      dateKey,
      entry,
      currentStreak,
      bestStreak: daily.bestStreak,
      totalSolved: daily.totalSolved,
      solved: daily.solvedDates.includes(dateKey),
      result: daily.results[dateKey] ?? null,
    };
  }

  async getArchive(): Promise<readonly DailyArchiveEntry[]> {
    const trustedNow = await this.clock.now();
    if (trustedNow === null) return [];
    const todayDateKey = toUtcDateKey(trustedNow);
    const history = this.getHistory();

    return this.entries
      .filter((entry) => entry.dateKey < todayDateKey)
      .slice()
      .sort((left, right) => right.dateKey.localeCompare(left.dateKey))
      .map((entry): DailyArchiveEntry => {
        const result = history.results[entry.dateKey] ?? null;
        return {
          dateKey: entry.dateKey,
          entry,
          ranked: false,
          archive: true,
          solved: result !== null,
          result,
        };
      });
  }

  /**
   * Begins or resumes today's one ranked attempt, or opens a released past
   * Daily as archive/practice. Future entries are never launchable.
   */
  async beginDaily(
    dateKey: string,
    dailyId: string,
  ): Promise<DailyAttemptLaunch | null> {
    const entry = this.findEntry(dateKey, dailyId);
    if (entry === null) return null;

    const trustedNow = await this.clock.now();
    if (trustedNow === null) return null;
    const nowMs = trustedNow.getTime();
    if (!Number.isFinite(nowMs)) return null;
    const todayDateKey = toUtcDateKey(trustedNow);
    if (dateKey > todayDateKey) return null;

    const archive = dateKey < todayDateKey;
    const history = this.getHistory();
    const existing = history.results[dateKey];

    if (existing !== undefined) {
      return {
        dateKey,
        entry,
        ranked: false,
        archive,
        elapsedMsAtLaunch: 0,
        attempt: 'replay',
      };
    }

    const saved = history.drafts[dateKey];
    const compatible = isCompatiblePuzzleSnapshot(
      entry.level,
      'daily',
      entry.id,
      saved,
    );
    const attempt: GameAnalyticsAttempt = compatible ? 'resume' : 'new';
    const snapshot = compatible && saved !== undefined
      ? saved
      : PuzzleSessionState.create(entry.level, 'daily', entry.id, undefined, nowMs).snapshot();

    if (!compatible) {
      this.profileService.update((profile) => ({
        ...profile,
        daily: {
          ...profile.daily,
          drafts: {
            ...profile.daily.drafts,
            [dateKey]: snapshot,
          },
        },
      }));
      await this.tryFlush();
    }

    return {
      dateKey,
      entry,
      ranked: !archive,
      archive,
      elapsedMsAtLaunch: archive
        ? snapshot.activePlayMs
        : Math.max(0, nowMs - snapshot.startedAtMs),
      attempt,
    };
  }

  async completeToday(elapsedMs?: number, hintsUsed = 0): Promise<DailyCompletionResult | null> {
    const trustedNow = await this.clock.now();
    if (trustedNow === null) return null;
    const entry = findDailyForDate(this.entries, trustedNow);
    if (entry === null) return null;
    return this.completeDailyAt(entry.dateKey, entry.id, trustedNow, elapsedMs, hintsUsed);
  }

  async completeDaily(
    dateKey: string,
    dailyId: string,
    elapsedMs?: number,
    hintsUsed = 0,
  ): Promise<DailyCompletionResult | null> {
    const trustedNow = await this.clock.now();
    if (trustedNow === null) return null;
    return this.completeDailyAt(dateKey, dailyId, trustedNow, elapsedMs, hintsUsed);
  }

  private async completeDailyAt(
    dateKey: string,
    dailyId: string,
    trustedNow: Date,
    elapsedMs?: number,
    hintsUsed = 0,
  ): Promise<DailyCompletionResult | null> {
    const entry = this.findEntry(dateKey, dailyId);
    if (entry === null) return null;

    const trustedDateKey = toUtcDateKey(trustedNow);
    if (dateKey > trustedDateKey) return null;
    const onTime = dateKey === trustedDateKey;
    const archive = !onTime;

    const historyBefore = this.getHistory();
    const existing = historyBefore.results[dateKey];
    if (existing !== undefined) {
      return {
        dailyId,
        dateKey,
        wasFirstSolve: false,
        ranked: false,
        archive,
        currentStreak: historyBefore.currentStreak,
        bestStreak: historyBefore.bestStreak,
        totalSolved: historyBefore.totalSolved,
        result: existing,
        persisted: true,
      };
    }

    const finishedAtMs = trustedNow.getTime();
    if (!Number.isFinite(finishedAtMs)) return null;

    const active = historyBefore.drafts[dateKey];
    const compatibleRankedSnapshot = isCompatiblePuzzleSnapshot(
      entry.level,
      'daily',
      entry.id,
      active,
    );

    let completionTimeMs: number;
    if (onTime && compatibleRankedSnapshot && active !== undefined) {
      completionTimeMs = Math.max(0, finishedAtMs - active.startedAtMs);
    } else if (archive && Number.isFinite(elapsedMs) && (elapsedMs ?? -1) >= 0) {
      completionTimeMs = Math.max(0, Math.floor(elapsedMs ?? 0));
    } else if (archive && compatibleRankedSnapshot && active !== undefined) {
      completionTimeMs = Math.max(0, finishedAtMs - active.startedAtMs);
    } else {
      return null;
    }

    const onTimeAttempt = onTime && compatibleRankedSnapshot;
    const safeHintsUsed = Math.max(0, Number.isInteger(hintsUsed) ? hintsUsed : 0);
    const ranked = onTimeAttempt && safeHintsUsed === 0;
    const result: DailyResultSummary = {
      bestTimeMs: completionTimeMs,
      minHintsUsed: safeHintsUsed,
      solvedWithoutHints: safeHintsUsed === 0,
    };
    const launchedDate = new Date(`${dateKey}T00:00:00.000Z`);
    const previousDateKey = previousUtcDateKey(launchedDate);

    this.profileService.update((profile) => {
      if (profile.daily.results[dateKey] !== undefined) return profile;

      const nextDaily = {
        ...profile.daily,
        drafts: Object.fromEntries(
          Object.entries(profile.daily.drafts)
            .filter(([draftDateKey]) => draftDateKey !== dateKey),
        ),
        totalSolved: profile.daily.totalSolved + 1,
        solvedDates: [...profile.daily.solvedDates, dateKey],
        results: {
          ...profile.daily.results,
          [dateKey]: result,
        },
      };

      const profileWithRating = {
        ...profile,
        mastery: {
          ...profile.mastery,
          rating: profile.mastery.rating + (onTimeAttempt ? DAILY_MASTER_RATING_REWARD : 0),
        },
        daily: nextDaily,
      };

      if (!onTimeAttempt) {
        return profileWithRating;
      }

      const currentStreak = profile.daily.lastSolvedDate === previousDateKey
        ? profile.daily.currentStreak + 1
        : 1;

      return {
        ...profileWithRating,
        daily: {
          ...nextDaily,
          currentStreak,
          bestStreak: Math.max(profile.daily.bestStreak, currentStreak),
          lastSolvedDate: dateKey,
        },
      };
    });

    const persisted = await this.tryFlush();
    const daily = this.getHistory();
    return {
      dailyId,
      dateKey,
      wasFirstSolve: true,
      ranked,
      archive,
      currentStreak: daily.currentStreak,
      bestStreak: daily.bestStreak,
      totalSolved: daily.totalSolved,
      result: daily.results[dateKey] ?? result,
      persisted,
    };
  }

  private findEntry(dateKey: string, dailyId: string): DailyEntry | null {
    return this.entries.find(
      (candidate) => candidate.dateKey === dateKey && candidate.id === dailyId,
    ) ?? null;
  }

  private async tryFlush(): Promise<boolean> {
    try {
      await this.profileService.flush();
      return true;
    } catch (error) {
      console.warn('[Dungeon Logic] Could not persist player profile after Daily update; keeping dirty in-memory state.', error);
      return false;
    }
  }
}

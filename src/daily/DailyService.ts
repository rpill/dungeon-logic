import type { DailyEntry } from '../content/daily/types';
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

function mergeDailyResult(
  previous: DailyResultSummary | undefined,
  next: DailyResultSummary,
): DailyResultSummary {
  if (previous === undefined) return next;
  return {
    bestTimeMs: Math.min(previous.bestTimeMs, next.bestTimeMs),
    minHintsUsed: Math.min(previous.minHintsUsed, next.minHintsUsed),
    solvedWithoutHints: previous.solvedWithoutHints || next.solvedWithoutHints,
  };
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

export interface DailyCompletionResult {
  readonly dateKey: string;
  readonly wasFirstSolve: boolean;
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

  async completeToday(
    result: DailyResultSummary,
  ): Promise<DailyCompletionResult | null> {
    const trustedNow = await this.clock.now();
    if (trustedNow === null) return null;
    const entry = findDailyForDate(this.entries, trustedNow);
    if (entry === null) return null;
    return this.completeDaily(entry.dateKey, entry.id, result);
  }

  async completeDaily(
    dateKey: string,
    dailyId: string,
    result: DailyResultSummary,
  ): Promise<DailyCompletionResult | null> {
    const entry = this.entries.find(
      (candidate) => candidate.dateKey === dateKey && candidate.id === dailyId,
    );
    if (entry === undefined) return null;

    const launchedDate = new Date(`${dateKey}T00:00:00.000Z`);
    const previousDateKey = previousUtcDateKey(launchedDate);
    const wasFirstSolve = !this.getHistory().solvedDates.includes(dateKey);
    this.profileService.update((profile) => {
      const currentStreak = wasFirstSolve
        ? (profile.daily.lastSolvedDate === previousDateKey
          ? profile.daily.currentStreak + 1
          : 1)
        : profile.daily.currentStreak;
      const mergedResult = mergeDailyResult(profile.daily.results[dateKey], result);

      return {
        ...profile,
        daily: {
          ...profile.daily,
          currentStreak,
          bestStreak: Math.max(profile.daily.bestStreak, currentStreak),
          lastSolvedDate: wasFirstSolve ? dateKey : profile.daily.lastSolvedDate,
          totalSolved: profile.daily.totalSolved + (wasFirstSolve ? 1 : 0),
          solvedDates: wasFirstSolve
            ? [...profile.daily.solvedDates, dateKey]
            : profile.daily.solvedDates,
          results: {
            ...profile.daily.results,
            [dateKey]: mergedResult,
          },
        },
      };
    });

    const persisted = await this.tryFlush();
    const daily = this.getHistory();
    return {
      dateKey,
      wasFirstSolve,
      currentStreak: daily.currentStreak,
      bestStreak: daily.bestStreak,
      totalSolved: daily.totalSolved,
      result: daily.results[dateKey] ?? result,
      persisted,
    };
  }

  private async tryFlush(): Promise<boolean> {
    try {
      await this.profileService.flush();
      return true;
    } catch (error) {
      console.warn('[Dungeon Logic] Could not persist player profile after Daily completion; keeping dirty in-memory state.', error);
      return false;
    }
  }
}

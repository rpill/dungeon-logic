import type { GameAnalyticsAttempt } from '../campaign/types';
import type { EndlessCatalog } from '../content/endless/EndlessCatalog';
import { isCompatiblePuzzleSnapshot } from '../gameplay/PuzzleSessionState';
import { getEndlessMasterRatingReward } from '../mastery/MasterRating';
import type { PlayerProfileService } from '../profile/PlayerProfileService';
import type { EndlessActiveKind, SerializedPuzzleState } from '../profile/types';
import type { LevelDefinition } from '../puzzle/types';

export const ENDLESS_SERVICE_REGISTRY_KEY = 'endless-service';
export const ENDLESS_RETRY_INTERVAL = 10 as const;

export interface EndlessLaunch {
  /** Zero-based stable catalog index. */
  readonly ordinal: number;
  readonly catalogIndex: number;
  readonly kind: EndlessActiveKind;
  readonly ranked: boolean;
  readonly freePlayOrdinal: number | null;
  readonly level: LevelDefinition;
  readonly savedPuzzle: SerializedPuzzleState | undefined;
  readonly attempt: GameAnalyticsAttempt;
}

export interface EndlessCompletionResult {
  readonly completedOrdinal: number;
  readonly completed: number;
  readonly catalogLength: number;
  readonly ranked: boolean;
  readonly catalogComplete: boolean;
  readonly ratingAward: number;
  readonly masterRating: number;
  readonly currentCleanStreak: number;
  readonly bestCleanStreak: number;
  readonly persisted: boolean;
}

export interface EndlessSkipResult {
  readonly skippedCatalogIndex: number;
  readonly ranked: boolean;
  readonly catalogComplete: boolean;
  readonly currentCleanStreak: number;
  readonly persisted: boolean;
}

export interface EndlessProgressSnapshot {
  readonly completed: number;
  readonly catalogLength: number;
  readonly skipped: number;
  readonly rankedComplete: boolean;
  readonly freePlayOrdinal: number;
}

export class EndlessService {
  private readonly catalog: EndlessCatalog;
  private readonly profileService: PlayerProfileService;

  private constructor(catalog: EndlessCatalog, profileService: PlayerProfileService) {
    this.catalog = catalog;
    this.profileService = profileService;
    this.sanitizeStateForCatalog();
  }

  static create(catalog: EndlessCatalog, profileService: PlayerProfileService): EndlessService {
    if (catalog.length <= 0) throw new Error('Endless catalog is empty.');
    return new EndlessService(catalog, profileService);
  }

  getCatalogLength(): number {
    return this.catalog.length;
  }

  getCompletedCount(): number {
    return Math.min(this.catalog.length, Math.max(0, this.profileService.getProfile().endless.completed));
  }

  getProgress(): EndlessProgressSnapshot {
    const endless = this.profileService.getProfile().endless;
    return {
      completed: this.getCompletedCount(),
      catalogLength: this.catalog.length,
      skipped: endless.skipped.length,
      rankedComplete: this.isRankedComplete(endless),
      freePlayOrdinal: endless.freePlayOrdinal,
    };
  }

  beginCurrent(): EndlessLaunch {
    const selection = this.ensureActiveSelection();
    const level = this.catalog.createLevel(selection.catalogIndex);
    const active = this.profileService.getProfile().endless.activePuzzle ?? undefined;
    const compatible = isCompatiblePuzzleSnapshot(level, 'endless', level.id, active);
    return {
      ordinal: selection.catalogIndex,
      catalogIndex: selection.catalogIndex,
      kind: selection.kind,
      ranked: selection.kind !== 'freeplay',
      freePlayOrdinal: selection.kind === 'freeplay'
        ? this.profileService.getProfile().endless.freePlayOrdinal
        : null,
      level,
      savedPuzzle: compatible ? active : undefined,
      attempt: compatible ? 'resume' : 'new',
    };
  }

  async completeCurrent(catalogIndex: number, hintsUsed: number): Promise<EndlessCompletionResult> {
    this.requireCatalogIndex(catalogIndex);
    const endlessBefore = this.profileService.getProfile().endless;
    if (endlessBefore.activeCatalogIndex !== catalogIndex || endlessBefore.activeKind === null) {
      throw new Error(`Endless completion mismatch: active ${String(endlessBefore.activeCatalogIndex)}, got ${catalogIndex}.`);
    }

    const kind = endlessBefore.activeKind;
    const ranked = kind !== 'freeplay';
    const clean = hintsUsed === 0;
    const ratingAward = ranked
      ? getEndlessMasterRatingReward(this.catalog.get(catalogIndex).difficultyBand)
      : 0;

    this.profileService.update((profile) => {
      const current = profile.endless;
      if (kind === 'freeplay') {
        return {
          ...profile,
          endless: {
            ...current,
            activeCatalogIndex: null,
            activeKind: null,
            activePuzzle: null,
            currentCleanStreak: 0,
            freePlayOrdinal: current.freePlayOrdinal + 1,
          },
        };
      }

      const currentCleanStreak = clean ? current.currentCleanStreak + 1 : 0;
      const bestCleanStreak = Math.max(current.bestCleanStreak, currentCleanStreak);
      const skipped = kind === 'retry'
        ? current.skipped.filter((index) => index !== catalogIndex)
        : current.skipped;
      const nextFreshIndex = kind === 'fresh'
        ? Math.max(current.nextFreshIndex, catalogIndex + 1)
        : current.nextFreshIndex;
      const completed = Math.min(this.catalog.length, current.completed + 1);

      return {
        ...profile,
        mastery: {
          ...profile.mastery,
          rating: profile.mastery.rating + ratingAward,
        },
        endless: {
          ...current,
          nextFreshIndex,
          completed,
          skipped,
          freshSolvesSinceRetry: kind === 'fresh'
            ? current.freshSolvesSinceRetry + 1
            : 0,
          activeCatalogIndex: null,
          activeKind: null,
          activePuzzle: null,
          currentCleanStreak,
          bestCleanStreak,
        },
      };
    });

    const persisted = await this.tryFlush('completion');
    const profile = this.profileService.getProfile();
    return {
      completedOrdinal: catalogIndex,
      completed: profile.endless.completed,
      catalogLength: this.catalog.length,
      ranked,
      catalogComplete: this.isRankedComplete(profile.endless),
      ratingAward,
      masterRating: profile.mastery.rating,
      currentCleanStreak: profile.endless.currentCleanStreak,
      bestCleanStreak: profile.endless.bestCleanStreak,
      persisted,
    };
  }

  async skipCurrent(catalogIndex: number): Promise<EndlessSkipResult> {
    this.requireCatalogIndex(catalogIndex);
    const endlessBefore = this.profileService.getProfile().endless;
    if (endlessBefore.activeCatalogIndex !== catalogIndex || endlessBefore.activeKind === null) {
      throw new Error(`Endless skip mismatch: active ${String(endlessBefore.activeCatalogIndex)}, got ${catalogIndex}.`);
    }
    const kind = endlessBefore.activeKind;
    const ranked = kind !== 'freeplay';

    this.profileService.update((profile) => {
      const current = profile.endless;
      if (kind === 'freeplay') {
        return {
          ...profile,
          endless: {
            ...current,
            activeCatalogIndex: null,
            activeKind: null,
            activePuzzle: null,
            currentCleanStreak: 0,
            freePlayOrdinal: current.freePlayOrdinal + 1,
          },
        };
      }

      const withoutCurrent = current.skipped.filter((index) => index !== catalogIndex);
      const skipped = [...withoutCurrent, catalogIndex];
      return {
        ...profile,
        endless: {
          ...current,
          nextFreshIndex: kind === 'fresh'
            ? Math.max(current.nextFreshIndex, catalogIndex + 1)
            : current.nextFreshIndex,
          skipped,
          freshSolvesSinceRetry: kind === 'retry' || current.skipped.length === 0
            ? 0
            : current.freshSolvesSinceRetry,
          activeCatalogIndex: null,
          activeKind: null,
          activePuzzle: null,
          currentCleanStreak: 0,
        },
      };
    });

    const persisted = await this.tryFlush('skip');
    const current = this.profileService.getProfile().endless;
    return {
      skippedCatalogIndex: catalogIndex,
      ranked,
      catalogComplete: this.isRankedComplete(current),
      currentCleanStreak: current.currentCleanStreak,
      persisted,
    };
  }

  private ensureActiveSelection(): { readonly catalogIndex: number; readonly kind: EndlessActiveKind } {
    const current = this.profileService.getProfile().endless;
    if (this.isValidActiveSelection(current.activeCatalogIndex, current.activeKind, current)) {
      return { catalogIndex: current.activeCatalogIndex!, kind: current.activeKind! };
    }

    const selection = this.selectNext(current);
    this.profileService.update((profile) => ({
      ...profile,
      endless: {
        ...profile.endless,
        activeCatalogIndex: selection.catalogIndex,
        activeKind: selection.kind,
        activePuzzle: null,
        currentCleanStreak: selection.kind === 'freeplay' ? 0 : profile.endless.currentCleanStreak,
      },
    }));
    return selection;
  }

  private selectNext(endless: ReturnType<PlayerProfileService['getProfile']>['endless']): {
    readonly catalogIndex: number;
    readonly kind: EndlessActiveKind;
  } {
    if (this.isRankedComplete(endless)) {
      return {
        catalogIndex: endless.freePlayOrdinal % this.catalog.length,
        kind: 'freeplay',
      };
    }

    if (endless.nextFreshIndex >= this.catalog.length) {
      const retry = endless.skipped[0];
      if (retry === undefined) throw new Error('Endless ranked state is incomplete but has no selectable puzzle.');
      return { catalogIndex: retry, kind: 'retry' };
    }

    if (endless.skipped.length > 0 && endless.freshSolvesSinceRetry >= ENDLESS_RETRY_INTERVAL) {
      return { catalogIndex: endless.skipped[0]!, kind: 'retry' };
    }

    return { catalogIndex: endless.nextFreshIndex, kind: 'fresh' };
  }

  private isRankedComplete(endless: ReturnType<PlayerProfileService['getProfile']>['endless']): boolean {
    return endless.nextFreshIndex >= this.catalog.length
      && endless.skipped.length === 0
      && endless.completed >= this.catalog.length;
  }

  private isValidActiveSelection(
    index: number | null,
    kind: EndlessActiveKind | null,
    endless: ReturnType<PlayerProfileService['getProfile']>['endless'],
  ): boolean {
    if (index === null || kind === null || index < 0 || index >= this.catalog.length) return false;
    if (kind === 'fresh') return index === endless.nextFreshIndex && endless.nextFreshIndex < this.catalog.length;
    if (kind === 'retry') return endless.skipped.includes(index);
    return this.isRankedComplete(endless) && index === endless.freePlayOrdinal % this.catalog.length;
  }

  private sanitizeStateForCatalog(): void {
    const current = this.profileService.getProfile().endless;
    const nextFreshIndex = Math.min(this.catalog.length, current.nextFreshIndex);
    const skipped = [...new Set(current.skipped)]
      .filter((index) => Number.isInteger(index) && index >= 0 && index < nextFreshIndex && index < this.catalog.length);
    const maximumCompleted = Math.max(0, nextFreshIndex - skipped.length);
    const completed = Math.min(this.catalog.length, Math.min(current.completed, maximumCompleted));
    const activeValid = this.isValidActiveSelection(current.activeCatalogIndex, current.activeKind, {
      ...current,
      nextFreshIndex,
      skipped,
      completed,
    });

    if (
      nextFreshIndex === current.nextFreshIndex
      && completed === current.completed
      && skipped.length === current.skipped.length
      && skipped.every((value, index) => value === current.skipped[index])
      && activeValid
    ) return;

    this.profileService.update((profile) => ({
      ...profile,
      endless: {
        ...profile.endless,
        nextFreshIndex,
        completed,
        skipped,
        activeCatalogIndex: activeValid ? current.activeCatalogIndex : null,
        activeKind: activeValid ? current.activeKind : null,
        activePuzzle: activeValid ? current.activePuzzle : null,
      },
    }));
  }

  private requireCatalogIndex(index: number): void {
    if (!Number.isInteger(index) || index < 0 || index >= this.catalog.length) {
      throw new RangeError(`Endless catalog index ${index} is out of range.`);
    }
  }

  private async tryFlush(reason: string): Promise<boolean> {
    try {
      await this.profileService.flush();
      return true;
    } catch (error) {
      console.warn(`[Dungeon Logic] Could not persist Endless ${reason}; keeping dirty in-memory state.`, error);
      return false;
    }
  }
}

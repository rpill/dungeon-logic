import type { GameAnalyticsAttempt } from '../campaign/types';
import type { EndlessCatalog } from '../content/endless/EndlessCatalog';
import { isCompatiblePuzzleSnapshot } from '../gameplay/PuzzleSessionState';
import type { PlayerProfileService } from '../profile/PlayerProfileService';
import type { SerializedPuzzleState } from '../profile/types';
import type { LevelDefinition } from '../puzzle/types';
import { EndlessLevelPicker } from './EndlessLevelPicker';

export const ENDLESS_SERVICE_REGISTRY_KEY = 'endless-service';

export interface EndlessLaunch {
  readonly ordinal: number;
  readonly level: LevelDefinition;
  readonly savedPuzzle: SerializedPuzzleState | undefined;
  readonly attempt: GameAnalyticsAttempt;
}

export interface EndlessCompletionResult {
  readonly completedOrdinal: number;
  readonly completed: number;
  readonly currentCleanStreak: number;
  readonly bestCleanStreak: number;
  readonly persisted: boolean;
}

export class EndlessService {
  private readonly catalog: EndlessCatalog;
  private readonly profileService: PlayerProfileService;
  private readonly picker: EndlessLevelPicker;

  private constructor(catalog: EndlessCatalog, profileService: PlayerProfileService) {
    this.catalog = catalog;
    this.profileService = profileService;
    this.picker = new EndlessLevelPicker(catalog);
  }

  static create(catalog: EndlessCatalog, profileService: PlayerProfileService): EndlessService {
    if (catalog.length <= 0) throw new Error('Endless catalog is empty.');
    return new EndlessService(catalog, profileService);
  }

  getCatalogLength(): number {
    return this.catalog.length;
  }

  getCurrentOrdinal(): number {
    return Math.max(0, this.profileService.getProfile().endless.ordinal);
  }

  getCompletedCount(): number {
    return Math.max(0, this.profileService.getProfile().endless.completed);
  }

  beginCurrent(): EndlessLaunch {
    return this.createLaunch(this.getCurrentOrdinal());
  }

  createLaunch(ordinal: number): EndlessLaunch {
    this.requireOrdinal(ordinal);
    const catalogIndex = this.picker.pickCatalogIndex(ordinal);
    const level = this.catalog.createLevel(catalogIndex);
    const active = this.profileService.getProfile().endless.activePuzzle ?? undefined;
    const compatible = isCompatiblePuzzleSnapshot(level, 'endless', level.id, active);
    return {
      ordinal,
      level,
      savedPuzzle: compatible ? active : undefined,
      attempt: compatible ? 'resume' : 'new',
    };
  }

  async completeCurrent(ordinal: number, hintsUsed: number): Promise<EndlessCompletionResult> {
    this.requireOrdinal(ordinal);
    const current = this.getCurrentOrdinal();
    if (ordinal !== current) {
      throw new Error(`Endless completion ordinal mismatch: expected ${current}, got ${ordinal}.`);
    }

    const nextOrdinal = ordinal + 1;
    const clean = hintsUsed === 0;
    this.profileService.update((profile) => {
      const currentCleanStreak = clean ? profile.endless.currentCleanStreak + 1 : 0;
      const bestCleanStreak = Math.max(profile.endless.bestCleanStreak, currentCleanStreak);
      return {
        ...profile,
        endless: {
          ordinal: nextOrdinal,
          completed: Math.max(profile.endless.completed, nextOrdinal),
          activePuzzle: null,
          currentCleanStreak,
          bestCleanStreak,
        },
      };
    });

    let persisted = true;
    try {
      await this.profileService.flush();
    } catch (error) {
      persisted = false;
      console.warn('[Dungeon Logic] Could not persist Endless completion; keeping dirty in-memory state.', error);
    }

    return {
      completedOrdinal: ordinal,
      completed: this.profileService.getProfile().endless.completed,
      currentCleanStreak: this.profileService.getProfile().endless.currentCleanStreak,
      bestCleanStreak: this.profileService.getProfile().endless.bestCleanStreak,
      persisted,
    };
  }

  private requireOrdinal(ordinal: number): void {
    if (!Number.isInteger(ordinal) || ordinal < 0) {
      throw new RangeError(`Endless ordinal ${ordinal} must be a non-negative integer.`);
    }
  }
}

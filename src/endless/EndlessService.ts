import type { GameAnalyticsAttempt } from '../campaign/types';
import type { EndlessCatalog } from '../content/endless/EndlessCatalog';
import { isCompatiblePuzzleSnapshot } from '../gameplay/PuzzleSessionState';
import type { PlayerProfileService } from '../profile/PlayerProfileService';
import type { SerializedPuzzleState } from '../profile/types';
import type { LevelDefinition } from '../puzzle/types';

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
  readonly catalogComplete: boolean;
  readonly next: EndlessLaunch | null;
  readonly persisted: boolean;
}

export class EndlessService {
  private readonly catalog: EndlessCatalog;
  private readonly profileService: PlayerProfileService;

  private constructor(catalog: EndlessCatalog, profileService: PlayerProfileService) {
    this.catalog = catalog;
    this.profileService = profileService;
  }

  static create(catalog: EndlessCatalog, profileService: PlayerProfileService): EndlessService {
    if (catalog.length <= 0) throw new Error('Endless catalog is empty.');
    return new EndlessService(catalog, profileService);
  }

  getCatalogLength(): number {
    return this.catalog.length;
  }

  isCatalogComplete(): boolean {
    return this.profileService.getProfile().endless.completed >= this.catalog.length;
  }

  getCurrentOrdinal(): number {
    const state = this.profileService.getProfile().endless;
    return Math.min(Math.max(0, state.ordinal), this.catalog.length - 1);
  }

  beginCurrent(): EndlessLaunch | null {
    if (this.isCatalogComplete()) return null;
    return this.createLaunch(this.getCurrentOrdinal());
  }

  createLaunch(ordinal: number): EndlessLaunch {
    this.requireOrdinal(ordinal);
    const level = this.catalog.createLevel(ordinal);
    const active = this.profileService.getProfile().endless.activePuzzle ?? undefined;
    const compatible = isCompatiblePuzzleSnapshot(level, 'endless', level.id, active);
    return {
      ordinal,
      level,
      savedPuzzle: compatible ? active : undefined,
      attempt: compatible ? 'resume' : 'new',
    };
  }

  async completeCurrent(ordinal: number): Promise<EndlessCompletionResult> {
    this.requireOrdinal(ordinal);
    const current = this.getCurrentOrdinal();
    if (ordinal !== current) {
      throw new Error(`Endless completion ordinal mismatch: expected ${current}, got ${ordinal}.`);
    }

    const lastOrdinal = this.catalog.length - 1;
    const catalogComplete = ordinal >= lastOrdinal;
    const nextOrdinal = catalogComplete ? lastOrdinal : ordinal + 1;

    this.profileService.update((profile) => ({
      ...profile,
      endless: {
        ordinal: nextOrdinal,
        completed: Math.min(this.catalog.length, Math.max(profile.endless.completed, ordinal + 1)),
        activePuzzle: null,
      },
    }));

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
      catalogComplete,
      next: catalogComplete ? null : this.createLaunch(nextOrdinal),
      persisted,
    };
  }

  private requireOrdinal(ordinal: number): void {
    if (!Number.isInteger(ordinal) || ordinal < 0 || ordinal >= this.catalog.length) {
      throw new RangeError(`Endless ordinal ${ordinal} is out of range 0..${this.catalog.length - 1}.`);
    }
  }
}

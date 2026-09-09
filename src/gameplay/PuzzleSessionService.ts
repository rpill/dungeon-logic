import type { LevelDefinition } from '../puzzle/types';
import type { PlayerProfileService } from '../profile/PlayerProfileService';
import type { SerializedPuzzleState } from '../profile/types';
import { PuzzleSessionState } from './PuzzleSessionState';

type PersistedSessionMode = 'campaign' | 'tutorial' | 'daily';

export class PuzzleSessionService {
  private readonly state: PuzzleSessionState;
  private readonly profileService: PlayerProfileService;
  private readonly persistenceMode: PersistedSessionMode;
  private readonly dailyDateKey: string | null;

  private constructor(
    state: PuzzleSessionState,
    profileService: PlayerProfileService,
    persistenceMode: PersistedSessionMode,
    dailyDateKey: string | null = null,
  ) {
    this.state = state;
    this.profileService = profileService;
    this.persistenceMode = persistenceMode;
    this.dailyDateKey = dailyDateKey;
  }

  static createCampaign(
    level: LevelDefinition,
    profileService: PlayerProfileService,
    saved?: SerializedPuzzleState,
    nowMs = Date.now(),
  ): PuzzleSessionService {
    return new PuzzleSessionService(
      PuzzleSessionState.create(level, 'campaign', level.id, saved, nowMs),
      profileService,
      'campaign',
    );
  }

  static createTutorial(
    level: LevelDefinition,
    profileService: PlayerProfileService,
    saved?: SerializedPuzzleState,
    nowMs = Date.now(),
  ): PuzzleSessionService {
    return new PuzzleSessionService(
      PuzzleSessionState.create(level, 'tutorial', level.id, saved, nowMs),
      profileService,
      'tutorial',
    );
  }

  static createDaily(
    level: LevelDefinition,
    profileService: PlayerProfileService,
    dateKey: string,
    saved?: SerializedPuzzleState,
    nowMs = Date.now(),
  ): PuzzleSessionService {
    return new PuzzleSessionService(
      PuzzleSessionState.create(level, 'daily', level.id, saved, nowMs),
      profileService,
      'daily',
      dateKey,
    );
  }

  getPuzzle() {
    return this.state.puzzle;
  }

  snapshot(): SerializedPuzzleState {
    return this.state.snapshot();
  }

  saveNow(): SerializedPuzzleState {
    const snapshot = this.snapshot();
    this.profileService.update((profile) => {
      if (this.persistenceMode === 'campaign') {
        return {
          ...profile,
          campaign: {
            ...profile.campaign,
            drafts: {
              ...profile.campaign.drafts,
              [snapshot.puzzleId]: snapshot,
            },
          },
        };
      }
      if (this.persistenceMode === 'tutorial') {
        return {
          ...profile,
          tutorial: {
            ...profile.tutorial,
            activePuzzle: snapshot,
          },
        };
      }
      if (this.dailyDateKey === null) return profile;
      return {
        ...profile,
        daily: {
          ...profile.daily,
          drafts: {
            ...profile.daily.drafts,
            [this.dailyDateKey]: snapshot,
          },
        },
      };
    });
    return snapshot;
  }

  clearActivePuzzle(): void {
    this.profileService.update((profile) => {
      if (this.persistenceMode === 'campaign') {
        return {
          ...profile,
          campaign: {
            ...profile.campaign,
            drafts: Object.fromEntries(
              Object.entries(profile.campaign.drafts)
                .filter(([levelId]) => levelId !== this.state.puzzleId),
            ),
          },
        };
      }
      if (this.persistenceMode === 'tutorial') {
        return {
          ...profile,
          tutorial: {
            ...profile.tutorial,
            activePuzzle: null,
          },
        };
      }
      if (this.dailyDateKey === null) return profile;
      return {
        ...profile,
        daily: {
          ...profile.daily,
          drafts: Object.fromEntries(
            Object.entries(profile.daily.drafts)
              .filter(([dateKey]) => dateKey !== this.dailyDateKey),
          ),
        },
      };
    });
  }

  addActiveTime(ms: number): void {
    this.state.addActiveTime(ms);
  }

  recordHint(): void {
    this.state.recordHint();
  }

  getActivePlayMs(): number {
    return this.state.getActivePlayMs();
  }

  getHintsUsed(): number {
    return this.state.getHintsUsed();
  }

  getStartedAtMs(): number {
    return this.state.getStartedAtMs();
  }

  async flush(): Promise<void> {
    await this.profileService.flush();
  }
}

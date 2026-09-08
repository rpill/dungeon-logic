import type { LevelDefinition } from '../puzzle/types';
import type { PlayerProfileService } from '../profile/PlayerProfileService';
import type { SerializedPuzzleState } from '../profile/types';
import { PuzzleSessionState } from './PuzzleSessionState';

export class PuzzleSessionService {
  private readonly state: PuzzleSessionState;
  private readonly profileService: PlayerProfileService;

  private constructor(
    state: PuzzleSessionState,
    profileService: PlayerProfileService,
  ) {
    this.state = state;
    this.profileService = profileService;
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
    this.profileService.update((profile) => ({
      ...profile,
      campaign: {
        ...profile.campaign,
        activePuzzle: snapshot,
      },
    }));
    return snapshot;
  }

  clearActivePuzzle(): void {
    this.profileService.update((profile) => ({
      ...profile,
      campaign: {
        ...profile.campaign,
        activePuzzle: null,
      },
    }));
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

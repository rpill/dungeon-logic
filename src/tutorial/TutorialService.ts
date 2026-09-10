import type { TutorialLevelEntry, TutorialLevelId } from '../content/tutorial/types';
import type { PlayerProfileService } from '../profile/PlayerProfileService';

export const TUTORIAL_SERVICE_REGISTRY_KEY = 'tutorial-service';

export interface TutorialCompletionResult {
  readonly recommendedNextLevel: TutorialLevelEntry | null;
  readonly tutorialCompleted: boolean;
  readonly persisted: boolean;
}

export class TutorialService {
  private readonly levels: readonly TutorialLevelEntry[];
  private readonly profileService: PlayerProfileService;

  private constructor(
    levels: readonly TutorialLevelEntry[],
    profileService: PlayerProfileService,
  ) {
    this.levels = levels;
    this.profileService = profileService;
  }

  static create(
    levels: readonly TutorialLevelEntry[],
    profileService: PlayerProfileService,
  ): TutorialService {
    return new TutorialService(levels, profileService);
  }

  getLevels(): readonly TutorialLevelEntry[] {
    return this.levels;
  }

  canEnterCampaign(): boolean {
    return this.profileService.getProfile().tutorial.completed;
  }

  getContinueLevel(): TutorialLevelEntry | null {
    const tutorial = this.profileService.getProfile().tutorial;
    const activeId = tutorial.activePuzzle?.mode === 'tutorial'
      ? tutorial.activePuzzle.puzzleId
      : null;
    if (activeId !== null) {
      const active = this.levels.find((entry) => entry.id === activeId);
      if (active !== undefined && this.canPlayLevel(active.id)) return active;
    }

    const completed = new Set(tutorial.completedLevelIds);
    return this.levels.find((entry) => !completed.has(entry.id)) ?? null;
  }

  async startEntryLevel(): Promise<TutorialLevelEntry> {
    const tutorial = this.profileService.getProfile().tutorial;
    if (tutorial.completed) {
      const firstLevel = this.levels[0];
      if (firstLevel === undefined) throw new Error('Tutorial manifest is empty.');

      this.profileService.update((profile) => ({
        ...profile,
        tutorial: {
          ...profile.tutorial,
          activePuzzle: null,
        },
      }));
      return firstLevel;
    }

    const continueLevel = this.getContinueLevel() ?? this.levels[0];
    if (continueLevel === undefined) throw new Error('Tutorial manifest is empty.');
    return this.requirePlayableLevel(continueLevel.id);
  }

  canPlayLevel(id: string): boolean {
    const entry = this.levels.find((level) => level.id === id);
    if (entry === undefined) return false;

    const tutorial = this.profileService.getProfile().tutorial;
    if (tutorial.completed) return true;
    if (tutorial.completedLevelIds.includes(entry.id)) return true;

    const completed = new Set(tutorial.completedLevelIds);
    const next = this.levels.find((candidate) => !completed.has(candidate.id));
    return next?.id === entry.id;
  }

  async startLevel(id: TutorialLevelId): Promise<TutorialLevelEntry> {
    return this.requirePlayableLevel(id);
  }

  async completeLevel(id: TutorialLevelId): Promise<TutorialCompletionResult> {
    const entry = this.requirePlayableLevel(id);

    this.profileService.update((profile) => {
      const completedSet = new Set(profile.tutorial.completedLevelIds);
      completedSet.add(entry.id);
      const completedLevelIds = this.levels
        .filter((candidate) => completedSet.has(candidate.id))
        .map((candidate) => candidate.id);
      const allComplete = this.levels.every((candidate) => completedSet.has(candidate.id));

      return {
        ...profile,
        tutorial: {
          completedLevelIds,
          completed: profile.tutorial.completed || allComplete,
          activePuzzle: null,
        },
      };
    });

    const tutorial = this.profileService.getProfile().tutorial;
    const currentIndex = this.levels.findIndex((candidate) => candidate.id === entry.id);
    const recommendedNextLevel = currentIndex >= 0 && currentIndex + 1 < this.levels.length
      ? this.levels[currentIndex + 1]
      : null;

    let persisted = true;
    try {
      await this.profileService.flush();
    } catch (error) {
      persisted = false;
      console.warn('[Dungeon Logic] Could not persist Tutorial completion; keeping dirty in-memory state.', error);
    }

    return {
      recommendedNextLevel,
      tutorialCompleted: tutorial.completed,
      persisted,
    };
  }

  private requirePlayableLevel(id: string): TutorialLevelEntry {
    const entry = this.levels.find((level) => level.id === id);
    if (entry === undefined) throw new Error(`Unknown tutorial level: ${id}.`);
    if (!this.canPlayLevel(id)) throw new Error(`Tutorial level is locked: ${id}.`);
    return entry;
  }
}

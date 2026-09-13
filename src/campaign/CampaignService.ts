import type { CampaignLevelEntry } from '../content/campaign/types';
import { isCompatiblePuzzleSnapshot } from '../gameplay/PuzzleSessionState';
import type { PlayerProfileService } from '../profile/PlayerProfileService';
import type { CampaignLevelResult } from '../profile/types';
import {
  campaignProgressSnapshot,
  getCampaignContinueEntry,
} from './CampaignProgress';
import { getPlayableCampaignIds } from './CampaignUnlocks';
import type {
  CampaignCompletionResult,
  CampaignProgressSnapshot,
} from './types';

export const CAMPAIGN_SERVICE_REGISTRY_KEY = 'campaign-service';

function mergeLevelResult(
  previous: CampaignLevelResult | undefined,
  next: CampaignLevelResult,
): CampaignLevelResult {
  if (previous === undefined) return next;
  return {
    bestTimeMs: Math.min(previous.bestTimeMs, next.bestTimeMs),
    minHintsUsed: Math.min(previous.minHintsUsed, next.minHintsUsed),
    solveCount: previous.solveCount + Math.max(1, next.solveCount),
    solvedWithoutHints: previous.solvedWithoutHints || next.solvedWithoutHints,
  };
}

export class CampaignService {
  private readonly levels: readonly CampaignLevelEntry[];
  private readonly profileService: PlayerProfileService;

  private constructor(
    levels: readonly CampaignLevelEntry[],
    profileService: PlayerProfileService,
  ) {
    this.levels = levels;
    this.profileService = profileService;
  }

  static create(
    levels: readonly CampaignLevelEntry[],
    profileService: PlayerProfileService,
  ): CampaignService {
    return new CampaignService(levels, profileService);
  }

  getLevels(): readonly CampaignLevelEntry[] {
    return this.levels;
  }

  getProgress(): CampaignProgressSnapshot {
    const campaign = this.profileService.getProfile().campaign;
    return campaignProgressSnapshot(
      campaign.completedLevelIds,
      campaign.lastPlayedLevelId,
    );
  }

  getPlayableLevels(): readonly CampaignLevelEntry[] {
    if (!this.profileService.getProfile().tutorial.completed) return [];

    const playable = new Set(
      getPlayableCampaignIds(
        this.levels,
        this.profileService.getProfile().campaign.completedLevelIds,
      ),
    );
    return this.levels
      .slice()
      .sort((left, right) => left.slot - right.slot)
      .filter((entry) => playable.has(entry.id));
  }

  getContinueLevel(): CampaignLevelEntry | null {
    const profile = this.profileService.getProfile();
    if (!profile.tutorial.completed) return null;
    const completed = new Set(profile.campaign.completedLevelIds);
    const lastPlayedLevelId = profile.campaign.lastPlayedLevelId;
    const lastPlayedDraft = lastPlayedLevelId === null
      ? undefined
      : profile.campaign.drafts[lastPlayedLevelId];

    const lastPlayedEntry = lastPlayedLevelId === null
      ? undefined
      : this.levels.find((entry) => entry.id === lastPlayedLevelId);
    if (
      lastPlayedEntry !== undefined
      && lastPlayedDraft !== undefined
      && isCompatiblePuzzleSnapshot(
        lastPlayedEntry.level,
        'campaign',
        lastPlayedEntry.id,
        lastPlayedDraft,
      )
      && !completed.has(lastPlayedEntry.id)
      && this.canPlayLevel(lastPlayedEntry.id)
    ) {
      return lastPlayedEntry;
    }

    return getCampaignContinueEntry(this.getProgress(), this.levels);
  }

  canPlayLevel(id: string): boolean {
    return this.getPlayableLevels().some((entry) => entry.id === id);
  }

  async startLevel(id: string): Promise<CampaignLevelEntry> {
    const entry = this.requirePlayableLevel(id);
    this.profileService.update((profile) => ({
      ...profile,
      campaign: {
        ...profile.campaign,
        lastPlayedLevelId: id,
      },
    }));
    return entry;
  }

  async completeLevel(
    id: string,
    resultMetadata?: CampaignLevelResult,
  ): Promise<CampaignCompletionResult> {
    const entry = this.requirePlayableLevel(id);
    const beforeProfile = this.profileService.getProfile();
    const beforeCompleted = beforeProfile.campaign.completedLevelIds;
    const wasCompleted = beforeCompleted.includes(id);

    this.profileService.update((profile) => {
      const completedLevelIds = wasCompleted
        ? profile.campaign.completedLevelIds
        : [...profile.campaign.completedLevelIds, id];
      const levelResults = resultMetadata === undefined
        ? profile.campaign.levelResults
        : {
          ...profile.campaign.levelResults,
          [id]: mergeLevelResult(profile.campaign.levelResults[id], resultMetadata),
        };

      return {
        ...profile,
        campaign: {
          ...profile.campaign,
          completedLevelIds,
          lastPlayedLevelId: id,
          levelResults,
          drafts: Object.fromEntries(
            Object.entries(profile.campaign.drafts)
              .filter(([levelId]) => levelId !== id),
          ),
        },
      };
    });

    this.profileService.recordCampaignCompletionForInterstitial(entry.slot);

    const progress = this.getProgress();
    const persisted = await this.tryFlush();

    return {
      progress,
      recommendedNextLevel: this.getRecommendedNextLevel(entry, progress),
      unlockedFeatures: !wasCompleted && id === 'campaign-005'
        ? ['daily']
        : [],
      persisted,
    };
  }

  private requirePlayableLevel(id: string): CampaignLevelEntry {
    const entry = this.levels.find((level) => level.id === id);
    if (entry === undefined) throw new Error(`Unknown campaign level: ${id}.`);
    if (!this.canPlayLevel(id)) throw new Error(`Campaign level is locked: ${id}.`);
    return entry;
  }

  private getRecommendedNextLevel(
    completedEntry: CampaignLevelEntry,
    progress: CampaignProgressSnapshot,
  ): CampaignLevelEntry | null {
    const completed = new Set(progress.completedLevelIds);
    const unsolvedPlayable = this.getPlayableLevels()
      .filter((entry) => !completed.has(entry.id))
      .sort((left, right) => left.slot - right.slot);

    return unsolvedPlayable.find((entry) => entry.slot > completedEntry.slot)
      ?? unsolvedPlayable[0]
      ?? null;
  }

  private async tryFlush(): Promise<boolean> {
    try {
      await this.profileService.flush();
      return true;
    } catch (error) {
      console.warn('[Dungeon Logic] Could not persist player profile after campaign completion; keeping dirty in-memory state.', error);
      return false;
    }
  }
}

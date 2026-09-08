import type { CampaignLevelEntry } from '../content/campaign/types';
import { getPlayableCampaignIds } from './CampaignUnlocks';
import type {
  CampaignLevelState,
  CampaignProgressSnapshot,
} from './types';

function entryById(
  manifest: readonly CampaignLevelEntry[],
  id: string,
): CampaignLevelEntry | undefined {
  return manifest.find((entry) => entry.id === id);
}

function getUnsolvedPlayableEntries(
  progress: CampaignProgressSnapshot,
  manifest: readonly CampaignLevelEntry[],
): readonly CampaignLevelEntry[] {
  const completed = new Set(progress.completedLevelIds);
  const playable = new Set(getPlayableCampaignIds(manifest, progress.completedLevelIds));
  return manifest
    .slice()
    .sort((left, right) => left.slot - right.slot)
    .filter((entry) => playable.has(entry.id) && !completed.has(entry.id));
}

export function getCampaignLevelState(
  entry: CampaignLevelEntry,
  progress: CampaignProgressSnapshot,
  manifest: readonly CampaignLevelEntry[],
): CampaignLevelState {
  if (progress.completedLevelIds.includes(entry.id)) return 'completed';

  const playable = new Set(getPlayableCampaignIds(manifest, progress.completedLevelIds));
  if (!playable.has(entry.id)) return 'locked';

  const unsolvedPlayable = getUnsolvedPlayableEntries(progress, manifest);
  const currentId = progress.lastPlayedLevelId !== null
    && unsolvedPlayable.some((candidate) => candidate.id === progress.lastPlayedLevelId)
    ? progress.lastPlayedLevelId
    : unsolvedPlayable[0]?.id ?? null;

  return entry.id === currentId ? 'current' : 'unlocked';
}

export function getCampaignContinueEntry(
  progress: CampaignProgressSnapshot,
  manifest: readonly CampaignLevelEntry[],
): CampaignLevelEntry | null {
  if (manifest.length === 0) return null;

  const unsolvedPlayable = getUnsolvedPlayableEntries(progress, manifest);
  if (progress.lastPlayedLevelId !== null) {
    const lastPlayed = unsolvedPlayable.find(
      (entry) => entry.id === progress.lastPlayedLevelId,
    );
    if (lastPlayed !== undefined) return lastPlayed;
  }

  if (unsolvedPlayable.length > 0) return unsolvedPlayable[0];

  const completed = new Set(progress.completedLevelIds);
  const completedEntries = manifest
    .filter((entry) => completed.has(entry.id))
    .slice()
    .sort((left, right) => left.slot - right.slot);
  return completedEntries.at(-1) ?? null;
}

export function shouldShowCampaignOnboarding(
  entry: CampaignLevelEntry,
  progress: CampaignProgressSnapshot,
): boolean {
  return entry.onboarding.length > 0 && !progress.completedLevelIds.includes(entry.id);
}

export function campaignProgressSnapshot(
  completedLevelIds: readonly string[],
  lastPlayedLevelId: string | null,
): CampaignProgressSnapshot {
  return {
    completedLevelIds,
    lastPlayedLevelId,
  };
}

export function findCampaignEntry(
  manifest: readonly CampaignLevelEntry[],
  id: string,
): CampaignLevelEntry | null {
  return entryById(manifest, id) ?? null;
}

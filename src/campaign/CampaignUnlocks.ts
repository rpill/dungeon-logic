import type { CampaignLevelEntry } from '../content/campaign/types';

const FRONTIER_SIZE = 3;

export function getPlayableCampaignIds(
  manifest: readonly CampaignLevelEntry[],
  completedIds: readonly string[],
): readonly string[] {
  const completed = new Set(completedIds);
  const ordered = manifest.slice().sort((left, right) => left.slot - right.slot);
  const frontier = new Set(
    ordered
      .filter((entry) => !completed.has(entry.id))
      .slice(0, FRONTIER_SIZE)
      .map((entry) => entry.id),
  );

  return ordered
    .filter((entry) => completed.has(entry.id) || frontier.has(entry.id))
    .map((entry) => entry.id);
}

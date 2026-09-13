import type { CampaignLevelEntry } from '../content/campaign/types';

const FRONTIER_SIZE = 3;
const ROW_SIZE = 8;

function campaignRowIndex(slot: number): number {
  return Math.floor((slot - 1) / ROW_SIZE);
}

export function getPlayableCampaignIds(
  manifest: readonly CampaignLevelEntry[],
  completedIds: readonly string[],
): readonly string[] {
  const completed = new Set(completedIds);
  const ordered = manifest.slice().sort((left, right) => left.slot - right.slot);
  const firstIncomplete = ordered.find((entry) => !completed.has(entry.id));

  if (firstIncomplete === undefined) {
    return ordered
      .filter((entry) => completed.has(entry.id))
      .map((entry) => entry.id);
  }

  const activeRow = campaignRowIndex(firstIncomplete.slot);
  const frontier = new Set(
    ordered
      .filter((entry) => (
        campaignRowIndex(entry.slot) === activeRow
        && !completed.has(entry.id)
      ))
      .slice(0, FRONTIER_SIZE)
      .map((entry) => entry.id),
  );

  return ordered
    .filter((entry) => completed.has(entry.id) || frontier.has(entry.id))
    .map((entry) => entry.id);
}

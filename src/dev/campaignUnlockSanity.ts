import { getPlayableCampaignIds } from '../campaign/CampaignUnlocks';
import type { CampaignLevelEntry } from '../content/campaign/types';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function campaignId(slot: number): string {
  return `campaign-${String(slot).padStart(3, '0')}`;
}

function entry(slot: number): CampaignLevelEntry {
  return {
    slot,
    id: campaignId(slot),
    level: { id: campaignId(slot) } as CampaignLevelEntry['level'],
  };
}

function manifest(count: number): readonly CampaignLevelEntry[] {
  return Array.from({ length: count }, (_, index) => entry(index + 1));
}

function playable(
  entries: readonly CampaignLevelEntry[],
  completedSlots: readonly number[],
): readonly string[] {
  return getPlayableCampaignIds(
    entries,
    completedSlots.map(campaignId),
  );
}

const six = manifest(6);
assert(
  playable(six, []).join(',') === [1, 2, 3].map(campaignId).join(','),
  'Fresh campaign exposes the first three unsolved levels 001/002/003.',
);
assert(
  playable(six, [2]).join(',') === [1, 2, 3, 4].map(campaignId).join(','),
  'Solving any frontier level keeps completed replays and advances to the next unsolved level.',
);
assert(
  playable(six, [2, 4]).join(',') === [1, 2, 3, 4, 5].map(campaignId).join(','),
  'Rolling frontier is based on the first three unsolved slots, not contiguous completion.',
);
assert(
  playable(six, [1, 2, 3]).join(',') === [1, 2, 3, 4, 5, 6].map(campaignId).join(','),
  'After the first three are solved, 004/005/006 become the unsolved frontier.',
);
assert(
  playable(six, [1, 2, 3, 4, 5, 6]).join(',') === [1, 2, 3, 4, 5, 6].map(campaignId).join(','),
  'Completed campaign keeps all solved levels replayable and has no synthetic frontier.',
);

const sparse = [entry(1), entry(3), entry(5), entry(7)];
assert(
  playable(sparse, []).join(',') === [1, 3, 5].map(campaignId).join(','),
  'Partial manifests expose the first three real unsolved entries and never synthesize missing slots.',
);

console.info('[Dungeon Logic] Campaign unlock sanity: rolling three-unsolved frontier passed');

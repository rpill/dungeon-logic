import {
  getPlayableCampaignIds,
  isManuscriptUnlocked,
} from '../campaign/CampaignUnlocks';
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
    chapterId: 'graveyard',
    onboarding: [],
  };
}

function manifest(...slots: number[]): readonly CampaignLevelEntry[] {
  return slots.map(entry);
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

const firstManuscript = manifest(1, 2, 3, 4, 5, 6, 7);
assert(
  playable(firstManuscript, []).join(',') === campaignId(1),
  'Fresh campaign exposes only 001.',
);
assert(
  playable(firstManuscript, [1]).join(',') === `${campaignId(1)},${campaignId(2)}`,
  'After 001, completed 001 remains replayable and only 002 becomes newly playable.',
);
assert(
  playable(firstManuscript, [1, 2, 3, 4]).join(',') === [1, 2, 3, 4, 5].map(campaignId).join(','),
  'After 004, only 005 is the next onboarding level.',
);
assert(
  playable(firstManuscript, [1, 2, 3, 4, 5]).join(',') === [1, 2, 3, 4, 5, 6, 7].map(campaignId).join(','),
  'After 005, existing 006/007 are both exposed.',
);

const firstTwoManuscripts = manifest(...Array.from({ length: 14 }, (_, index) => index + 1));
assert(
  !isManuscriptUnlocked('manuscript-ii', [1, 2, 3, 4, 5].map(campaignId), firstTwoManuscripts),
  'Manuscript II stays locked at 5/7 solved in Manuscript I.',
);
assert(
  isManuscriptUnlocked('manuscript-ii', [1, 2, 3, 4, 5, 6].map(campaignId), firstTwoManuscripts),
  'Manuscript II unlocks at 6/7 solved in Manuscript I.',
);

const afterSixInFirst = playable(firstTwoManuscripts, [1, 2, 3, 4, 5, 6]);
assert(
  [8, 9, 10].every((slot) => afterSixInFirst.includes(campaignId(slot))),
  'Initial Manuscript II frontier exposes 08/09/10.',
);
assert(
  !afterSixInFirst.includes(campaignId(11)),
  'Initial Manuscript II frontier does not expose 11 yet.',
);

const afterSolvingNine = playable(firstTwoManuscripts, [1, 2, 3, 4, 5, 6, 9]);
assert(
  [8, 10, 11].every((slot) => afterSolvingNine.includes(campaignId(slot))),
  'Solving 09 advances the Manuscript II frontier to 08/10/11.',
);
assert(
  afterSolvingNine.includes(campaignId(9)),
  'Solved 09 remains replayable.',
);

const partialAfterOnboarding = manifest(1, 2, 3, 4, 5, 7);
const partialPlayable = playable(partialAfterOnboarding, [1, 2, 3, 4, 5]);
assert(
  partialPlayable.includes(campaignId(7)) && !partialPlayable.includes(campaignId(6)),
  'Partial manifests expose only real promoted entries and never synthesize missing 006.',
);

console.info('[Dungeon Logic] Campaign unlock sanity: manuscripts + onboarding + frontier progression passed');

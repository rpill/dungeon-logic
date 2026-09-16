import { CampaignService } from '../campaign/CampaignService';
import { campaignManifest } from '../content/campaign/manifest';
import { PlayerProfileService } from '../profile/PlayerProfileService';
import type { PlayerProfileStorage } from '../profile/PlayerProfileStorage';
import type { PlayerProfileV5 } from '../profile/types';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

class FakeStorage implements PlayerProfileStorage {
  value: PlayerProfileV5 | null = null;

  async load(): Promise<unknown | null> {
    return this.value;
  }

  async save(profile: PlayerProfileV5): Promise<void> {
    this.value = profile;
  }
}

async function main(): Promise<void> {
  const profile = await PlayerProfileService.create(campaignManifest, new FakeStorage(), { saveDelayMs: 60_000 });
  profile.update((current) => ({
    ...current,
    tutorial: {
      ...current.tutorial,
      completedLevelIds: ['tutorial-001', 'tutorial-002', 'tutorial-003', 'tutorial-004', 'tutorial-005'],
      completed: true,
    },
  }));
  const campaign = CampaignService.create(campaignManifest, profile);

  for (let slot = 1; slot <= 4; slot += 1) {
    await campaign.completeLevel(`campaign-${String(slot).padStart(3, '0')}`);
  }

  const firstFive = await campaign.completeLevel('campaign-005');
  assert(
    firstFive.unlockedFeatures.join(',') === 'daily',
    'First completion of campaign-005 announces Daily only.',
  );

  const replayFive = await campaign.completeLevel('campaign-005');
  assert(
    replayFive.unlockedFeatures.length === 0,
    'Replaying campaign-005 never announces the same feature unlock again.',
  );

  const endlessAccess = campaign as unknown as { isEndlessUnlocked?: () => boolean };
  assert(typeof endlessAccess.isEndlessUnlocked === 'function', 'Campaign service must expose the Endless unlock gate.');

  const six = await campaign.completeLevel('campaign-006');
  assert(six.unlockedFeatures.length === 0, 'Campaign-006 does not unlock another feature.');
  await campaign.completeLevel('campaign-007');
  assert(!endlessAccess.isEndlessUnlocked!(), 'Endless stays locked until the full first campaign row is solved.');

  const eight = await campaign.completeLevel('campaign-008');
  assert(
    eight.unlockedFeatures.join(',') === 'endless',
    'Solving the final level of the first campaign row announces Endless exactly once.',
  );
  assert(endlessAccess.isEndlessUnlocked!(), 'Endless unlocks after campaign levels 1-8 are complete.');

  const replayEight = await campaign.completeLevel('campaign-008');
  assert(replayEight.unlockedFeatures.length === 0, 'Replaying campaign-008 never repeats the Endless unlock announcement.');

  console.info('[Dungeon Logic] Feature unlock sanity: Daily at 5 + Endless after first campaign row passed');
}

void main();

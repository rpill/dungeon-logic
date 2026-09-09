import { CampaignService } from '../campaign/CampaignService';
import { campaignManifest } from '../content/campaign/manifest';
import { PlayerProfileService } from '../profile/PlayerProfileService';
import type { PlayerProfileStorage } from '../profile/PlayerProfileStorage';
import type { PlayerProfileV4 } from '../profile/types';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

class FakeStorage implements PlayerProfileStorage {
  value: PlayerProfileV4 | null = null;

  async load(): Promise<unknown | null> {
    return this.value;
  }

  async save(profile: PlayerProfileV4): Promise<void> {
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
    firstFive.unlockedFeatures.join(',') === 'daily,statistics',
    'First completion of campaign-005 announces Daily and Statistics together.',
  );

  const replayFive = await campaign.completeLevel('campaign-005');
  assert(
    replayFive.unlockedFeatures.length === 0,
    'Replaying campaign-005 never announces the same feature unlock again.',
  );

  const six = await campaign.completeLevel('campaign-006');
  assert(six.unlockedFeatures.length === 0, 'Later campaign completions do not repeat the level-5 unlock announcement.');

  console.info('[Dungeon Logic] Feature unlock sanity: level-5 Daily + Statistics announcement is one-shot passed');
}

void main();

import { readFileSync } from 'node:fs';
import { CampaignService } from '../campaign/CampaignService';
import type { CampaignLevelEntry } from '../content/campaign/types';
import {
  INTERSTITIAL_COMPLETION_INTERVAL,
  INTERSTITIAL_COOLDOWN_MS,
  isInterstitialEligible,
} from '../monetization/InterstitialPolicy';
import { MonetizationService } from '../monetization/MonetizationService';
import { PlayerProfileService } from '../profile/PlayerProfileService';
import type { PlayerProfileStorage } from '../profile/PlayerProfileStorage';
import type { AdsPort, InterstitialResult, RewardedResult } from '../platform/services';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function eligible(input: {
  completedSlot: number;
  completions: number;
  lastInterstitialAtMs: number | null;
  nowMs: number;
}): boolean {
  return isInterstitialEligible({
    completedSlot: input.completedSlot,
    state: {
      campaignCompletionsSinceOpportunity: input.completions,
      lastInterstitialAtMs: input.lastInterstitialAtMs,
    },
    nowMs: input.nowMs,
  });
}

function entry(slot: number): CampaignLevelEntry {
  const id = `campaign-${String(slot).padStart(3, '0')}`;
  return {
    slot,
    id,
    chapterId: 'graveyard',
    onboarding: [],
    level: {
      id,
      width: 1,
      height: 1,
      rowClues: [0],
      columnClues: [0],
      monsters: [],
      chests: [],
      blockers: [],
      doors: [],
      solution: ['.'],
    } as CampaignLevelEntry['level'],
  };
}

class FakeProfileStorage implements PlayerProfileStorage {
  value: unknown | null = null;
  saves = 0;

  async load(): Promise<unknown | null> {
    return this.value;
  }

  async save(value: unknown): Promise<void> {
    this.value = value;
    this.saves += 1;
  }
}

class FakeAds implements AdsPort {
  interstitialCalls = 0;
  rewardedCalls = 0;
  private interstitialResult: InterstitialResult;
  private rewardedResult: RewardedResult;
  private rejectRewarded = false;

  constructor(
    interstitialResult: InterstitialResult,
    rewardedResult: RewardedResult = 'unavailable',
  ) {
    this.interstitialResult = interstitialResult;
    this.rewardedResult = rewardedResult;
  }

  setInterstitialResult(result: InterstitialResult): void {
    this.interstitialResult = result;
  }

  async showInterstitial(): Promise<InterstitialResult> {
    this.interstitialCalls += 1;
    return this.interstitialResult;
  }

  setRewardedResult(result: RewardedResult): void {
    this.rewardedResult = result;
    this.rejectRewarded = false;
  }

  rejectNextRewarded(): void {
    this.rejectRewarded = true;
  }

  async showRewarded(): Promise<RewardedResult> {
    this.rewardedCalls += 1;
    if (this.rejectRewarded) {
      this.rejectRewarded = false;
      throw new Error('rewarded failed');
    }
    return this.rewardedResult;
  }
}

const TEST_MANIFEST = Array.from({ length: 8 }, (_, index) => entry(index + 1));

async function createProfileService(
  storage: PlayerProfileStorage = new FakeProfileStorage(),
): Promise<PlayerProfileService> {
  return PlayerProfileService.create(TEST_MANIFEST, storage, { saveDelayMs: 60_000 });
}

class HangingProfileStorage implements PlayerProfileStorage {
  async load(): Promise<unknown | null> {
    return null;
  }

  async save(): Promise<void> {
    await new Promise<void>(() => {});
  }
}

async function main(): Promise<void> {
  assert(INTERSTITIAL_COMPLETION_INTERVAL === 2, 'Interstitial cadence is two post-onboarding campaign completions.');
  assert(INTERSTITIAL_COOLDOWN_MS === 4 * 60 * 1000, 'Interstitial cooldown is four minutes.');

  assert(!eligible({ completedSlot: 1, completions: 99, lastInterstitialAtMs: null, nowMs: 1_000_000 }), 'Level 001 is protected from interstitials.');
  assert(!eligible({ completedSlot: 5, completions: 99, lastInterstitialAtMs: null, nowMs: 1_000_000 }), 'Level 005 is protected from interstitials.');
  assert(!eligible({ completedSlot: 6, completions: 1, lastInterstitialAtMs: null, nowMs: 1_000_000 }), 'One post-onboarding completion is not enough.');
  assert(eligible({ completedSlot: 6, completions: 2, lastInterstitialAtMs: null, nowMs: 1_000_000 }), 'Two post-onboarding completions are eligible when there is no prior interstitial timestamp.');

  const last = 1_000_000;
  assert(!eligible({ completedSlot: 7, completions: 2, lastInterstitialAtMs: last, nowMs: last + INTERSTITIAL_COOLDOWN_MS - 1 }), 'Cooldown blocks one millisecond before four minutes.');
  assert(eligible({ completedSlot: 7, completions: 2, lastInterstitialAtMs: last, nowMs: last + INTERSTITIAL_COOLDOWN_MS }), 'Cooldown allows exactly at four minutes.');
  assert(!eligible({ completedSlot: 7, completions: 2, lastInterstitialAtMs: last, nowMs: last - 1 }), 'Clock rollback does not create an ad opportunity.');
  assert(!eligible({ completedSlot: 7, completions: 2, lastInterstitialAtMs: last, nowMs: Number.NaN }), 'Invalid current timestamp is ineligible.');

  const profileStorage = new FakeProfileStorage();
  const profileService = await createProfileService(profileStorage);
  profileService.update((profile) => ({
    ...profile,
    campaign: {
      ...profile.campaign,
      completedLevelIds: TEST_MANIFEST.slice(0, 4).map((candidate) => candidate.id),
      lastPlayedLevelId: 'campaign-004',
    },
  }));
  const campaign = CampaignService.create(TEST_MANIFEST, profileService);
  await campaign.completeLevel('campaign-005');
  assert(
    profileService.getProfile().ads.campaignCompletionsSinceOpportunity === 0,
    'Onboarding campaign completion does not increment the interstitial opportunity counter.',
  );
  await campaign.completeLevel('campaign-006');
  await campaign.completeLevel('campaign-007');
  assert(
    profileService.getProfile().ads.campaignCompletionsSinceOpportunity === 2,
    'Real post-onboarding campaign completions increment the opportunity counter.',
  );
  const persistedAfterCompletion = profileStorage.value as { ads?: { campaignCompletionsSinceOpportunity?: number } } | null;
  assert(
    persistedAfterCompletion?.ads?.campaignCompletionsSinceOpportunity === 2,
    'Campaign completion flush persists the interstitial opportunity counter with progression.',
  );

  const nowMs = 5_000_000;
  const ads = new FakeAds('shown');
  const monetization = MonetizationService.create(profileService, ads, () => nowMs);
  await monetization.maybeShowCampaignInterstitial(7);
  assert(ads.interstitialCalls === 1, 'Eligible campaign Next requests exactly one interstitial.');
  assert(
    profileService.getProfile().ads.campaignCompletionsSinceOpportunity === 0,
    'Using an eligible opportunity resets the campaign completion counter.',
  );
  assert(
    profileService.getProfile().ads.lastInterstitialAtMs === nowMs,
    'A shown interstitial records the successful display timestamp.',
  );

  profileService.recordCampaignCompletionForInterstitial(8);
  await monetization.maybeShowCampaignInterstitial(8);
  assert(ads.interstitialCalls === 1, 'Ineligible campaign Next does not call the ad port.');
  assert(
    profileService.getProfile().ads.campaignCompletionsSinceOpportunity === 1,
    'An ineligible transition keeps accumulated campaign completions.',
  );

  profileService.recordCampaignCompletionForInterstitial(8);
  const afterCooldownMs = nowMs + INTERSTITIAL_COOLDOWN_MS;
  ads.setInterstitialResult('skipped');
  const skippedMonetization = MonetizationService.create(profileService, ads, () => afterCooldownMs);
  await skippedMonetization.maybeShowCampaignInterstitial(8);
  assert(ads.interstitialCalls === 2, 'Eligible skipped opportunity still calls the ad port once.');
  assert(
    profileService.getProfile().ads.campaignCompletionsSinceOpportunity === 0,
    'Skipped opportunity resets the completion cadence so Next cannot hammer the ad port.',
  );
  assert(
    profileService.getProfile().ads.lastInterstitialAtMs === nowMs,
    'Skipped opportunity does not pretend an interstitial was shown.',
  );

  profileService.recordCampaignCompletionForInterstitial(8);
  profileService.recordCampaignCompletionForInterstitial(8);
  ads.setInterstitialResult('unavailable');
  const unavailableMonetization = MonetizationService.create(
    profileService,
    ads,
    () => afterCooldownMs + INTERSTITIAL_COOLDOWN_MS,
  );
  await unavailableMonetization.maybeShowCampaignInterstitial(8);
  assert(ads.interstitialCalls === 3, 'Unavailable ad port resolves the opportunity without trapping the caller.');
  assert(
    profileService.getProfile().ads.campaignCompletionsSinceOpportunity === 0,
    'Unavailable opportunity also consumes the cadence opportunity.',
  );
  assert(
    profileService.getProfile().ads.lastInterstitialAtMs === nowMs,
    'Unavailable opportunity does not update the successful display timestamp.',
  );

  const hangingProfileService = await createProfileService(new HangingProfileStorage());
  hangingProfileService.recordCampaignCompletionForInterstitial(6);
  hangingProfileService.recordCampaignCompletionForInterstitial(7);
  const immediateAds = new FakeAds('shown');
  let transitionResolved = false;
  void MonetizationService.create(hangingProfileService, immediateAds, () => 9_000_000)
    .maybeShowCampaignInterstitial(7)
    .then(() => {
      transitionResolved = true;
    });
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  assert(
    immediateAds.interstitialCalls === 1,
    'Campaign Next does not wait for profile persistence before requesting the ad.',
  );
  assert(
    transitionResolved,
    'Campaign Next transition resolves after the ad promise even if profile persistence is still pending.',
  );


  const rewardedProfile = await createProfileService();
  rewardedProfile.consumeFreeHint();
  rewardedProfile.consumeFreeHint();
  rewardedProfile.consumeFreeHint();
  const rewardedAds = new FakeAds('unavailable', 'rewarded');
  const rewardedMonetization = MonetizationService.create(rewardedProfile, rewardedAds);
  const freeBeforeRewarded = rewardedProfile.getFreeHintsRemaining();
  const totalUsedBeforeRewarded = rewardedProfile.getProfile().hints.totalUsed;
  assert(
    await rewardedMonetization.requestRewardedHint() === 'rewarded',
    'Rewarded ad result is preserved for hint policy.',
  );
  assert(rewardedAds.rewardedCalls === 1, 'Explicit rewarded request calls AdsPort exactly once.');
  assert(
    rewardedProfile.getFreeHintsRemaining() === freeBeforeRewarded,
    'Rewarded permission never refills the permanent free hint counter.',
  );
  assert(
    rewardedProfile.getProfile().hints.totalUsed === totalUsedBeforeRewarded,
    'Watching the ad alone does not count a hint before a hint is actually delivered.',
  );
  rewardedProfile.recordRewardedHintUsed();
  assert(
    rewardedProfile.getProfile().hints.totalUsed === totalUsedBeforeRewarded + 1,
    'A delivered rewarded hint increments total hint usage exactly once.',
  );
  assert(
    rewardedProfile.getFreeHintsRemaining() === 0,
    'Recording a rewarded hint still does not alter freeRemaining.',
  );

  rewardedAds.setRewardedResult('closed');
  assert(
    await rewardedMonetization.requestRewardedHint() === 'closed',
    'Closing rewarded video preserves the closed result.',
  );
  rewardedAds.setRewardedResult('unavailable');
  assert(
    await rewardedMonetization.requestRewardedHint() === 'unavailable',
    'Unavailable rewarded video preserves the unavailable result.',
  );
  rewardedAds.rejectNextRewarded();
  const warn = console.warn;
  console.warn = () => {};
  try {
    assert(
      await rewardedMonetization.requestRewardedHint() === 'unavailable',
      'Rejected rewarded ad promise maps to unavailable.',
    );
  } finally {
    console.warn = warn;
  }

  await rewardedProfile.flush();

  const campaignServiceSource = readFileSync('src/campaign/CampaignService.ts', 'utf8');
  assert(
    campaignServiceSource.includes('recordCampaignCompletionForInterstitial'),
    'Campaign completion persistence records post-onboarding completion opportunities.',
  );
  const gameSceneSource = readFileSync('src/scenes/GameScene.ts', 'utf8');
  assert(
    gameSceneSource.includes('maybeShowCampaignInterstitial'),
    'Campaign Next wiring consults MonetizationService before navigation.',
  );
  const adCallOccurrences = gameSceneSource.match(/maybeShowCampaignInterstitial/g) ?? [];
  assert(
    adCallOccurrences.length === 1,
    'GameScene has exactly one forced interstitial call path.',
  );
  const nextLabelIndex = gameSceneSource.indexOf('label: copy.game.next');
  const adCallIndex = gameSceneSource.indexOf('maybeShowCampaignInterstitial', nextLabelIndex);
  const pauseBeforeAdIndex = gameSceneSource.lastIndexOf('pauseActiveTimer()', adCallIndex);
  const startNextIndex = gameSceneSource.indexOf('await this.startNextLevel', adCallIndex);
  assert(
    nextLabelIndex >= 0
      && pauseBeforeAdIndex > nextLabelIndex
      && adCallIndex > pauseBeforeAdIndex
      && startNextIndex > adCallIndex,
    'Campaign Next pauses active time, awaits the interstitial opportunity, then starts the next level.',
  );

  const rewardedCallOccurrences = gameSceneSource.match(/requestRewardedHint/g) ?? [];
  assert(
    rewardedCallOccurrences.length === 1,
    'GameScene has exactly one explicit rewarded-hint request path.',
  );
  assert(
    gameSceneSource.includes('copy.game.rewardedPrompt'),
    'Rewarded hint path requires localized explicit confirmation copy before requesting the ad.',
  );
  assert(
    gameSceneSource.includes('recordRewardedHintUsed'),
    'GameScene records rewarded hint usage only when it delivers the hint.',
  );

  console.info('[Dungeon Logic] Monetization sanity: interstitial + rewarded hint policies passed');
}

void main();

import { readFileSync } from 'node:fs';
import { AnalyticsService, type AnalyticsPuzzleContext } from '../analytics/AnalyticsService';
import type { AnalyticsGoalName, AnalyticsParams, AnalyticsTransport } from '../analytics/AnalyticsTransport';
import { MonetizationService } from '../monetization/MonetizationService';
import type { AdsPort, RewardedResult } from '../platform/services';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

class CaptureTransport implements AnalyticsTransport {
  readonly events: { name: AnalyticsGoalName; params: AnalyticsParams }[] = [];
  sendGoal(name: AnalyticsGoalName, params: AnalyticsParams): void {
    this.events.push({ name, params });
  }
}

class FakeAds implements AdsPort {
  calls = 0;
  result: RewardedResult = 'rewarded';
  rejectNext = false;
  async showRewarded(): Promise<RewardedResult> {
    this.calls += 1;
    if (this.rejectNext) {
      this.rejectNext = false;
      throw new Error('rewarded failed');
    }
    return this.result;
  }
}

async function main(): Promise<void> {
  const productionFiles = [
    'src/platform/services.ts',
    'src/platform/yandex.ts',
    'src/platform/local.ts',
    'src/analytics/AnalyticsService.ts',
    'src/analytics/AnalyticsTransport.ts',
    'src/monetization/MonetizationService.ts',
    'src/profile/types.ts',
    'src/profile/PlayerProfile.ts',
    'src/profile/PlayerProfileMerge.ts',
    'src/profile/PlayerProfileService.ts',
    'src/campaign/CampaignService.ts',
    'src/scenes/GameScene.ts',
  ];
  const source = productionFiles.map((file) => readFileSync(file, 'utf8')).join('\n');
  for (const forbidden of [
    'showFullscreenAdv',
    'showInterstitial',
    'ad_interstitial_result',
    'interstitial_request_failed',
    'maybeShowCampaignInterstitial',
    'recordCampaignCompletionForInterstitial',
    'campaignCompletionsSinceOpportunity',
    'lastInterstitialAtMs',
  ]) {
    assert(!source.includes(forbidden), `Rewarded-only production source must not contain ${forbidden}.`);
  }

  const transport = new CaptureTransport();
  const analytics = new AnalyticsService(transport);
  const ads = new FakeAds();
  const monetization = MonetizationService.create(ads, analytics);
  const context: AnalyticsPuzzleContext = { mode: 'campaign', puzzleId: 'campaign-001', slot: 1 };

  assert(await monetization.requestRewardedHint(context) === 'rewarded', 'Rewarded result is preserved.');
  assert(ads.calls === 1, 'Rewarded Hint explicitly calls the ad port once.');
  assert(transport.events.some((event) => event.name === 'ad_rewarded_result' && event.params.result === 'rewarded'), 'Rewarded result is measured.');

  ads.result = 'closed';
  assert(await monetization.requestRewardedHint(context) === 'closed', 'Closed rewarded video is preserved.');
  ads.rejectNext = true;
  const warn = console.warn;
  console.warn = () => {};
  try {
    assert(await monetization.requestRewardedHint(context) === 'unavailable', 'Rejected rewarded request maps to unavailable.');
  } finally {
    console.warn = warn;
  }
  assert(transport.events.some((event) => event.name === 'tech_error' && event.params.code === 'rewarded_request_failed'), 'Rewarded request failure emits the stable technical error.');

  console.info('[Dungeon Logic] Monetization sanity: rewarded Hint only passed');
}

void main();

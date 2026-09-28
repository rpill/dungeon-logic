import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const files = [
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
  'src/scenes/GameScene.ts',
];
const source = files.map((file) => `${file}\n${readFileSync(file, 'utf8')}`).join('\n');

for (const forbidden of [
  'showFullscreenAdv',
  'showInterstitial',
  'ad_interstitial_result',
  'interstitial_request_failed',
  'maybeShowCampaignInterstitial',
  'recordCampaignCompletionForInterstitial',
  'consumeCampaignInterstitialOpportunity',
  'recordInterstitialShown',
  'campaignCompletionsSinceOpportunity',
  'lastInterstitialAtMs',
]) {
  assert(!source.includes(forbidden), `Rewarded-only monetization must not contain ${forbidden}.`);
}

assert(source.includes('showRewardedVideo'), 'Yandex rewarded-video SDK path must remain available.');
assert(source.includes('ad_rewarded_result'), 'Rewarded analytics goal must remain available.');
assert(source.includes('requestRewardedHint'), 'Rewarded Hint product flow must remain wired.');

console.info('[Dungeon Logic] Rewarded-only monetization source sanity passed');

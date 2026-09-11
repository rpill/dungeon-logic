import type { AnalyticsPuzzleContext } from '../analytics/AnalyticsService';
import { AnalyticsService } from '../analytics/AnalyticsService';
import type { AdsPort, RewardedResult } from '../platform/services';
import type { PlayerProfileService } from '../profile/PlayerProfileService';
import { isInterstitialEligible } from './InterstitialPolicy';

export type MonetizationNow = () => number;

export class MonetizationService {
  private readonly profileService: PlayerProfileService;
  private readonly ads: AdsPort;
  private readonly analytics: AnalyticsService;
  private readonly now: MonetizationNow;

  private constructor(
    profileService: PlayerProfileService,
    ads: AdsPort,
    analytics: AnalyticsService,
    now: MonetizationNow,
  ) {
    this.profileService = profileService;
    this.ads = ads;
    this.analytics = analytics;
    this.now = now;
  }

  static create(
    profileService: PlayerProfileService,
    ads: AdsPort,
    analytics: AnalyticsService,
    now: MonetizationNow = () => Date.now(),
  ): MonetizationService {
    return new MonetizationService(profileService, ads, analytics, now);
  }

  async requestRewardedHint(context: AnalyticsPuzzleContext): Promise<RewardedResult> {
    try {
      const result = await this.ads.showRewarded();
      this.analytics.rewardedResult(result, context);
      return result;
    } catch (error) {
      console.warn('[Dungeon Logic] Rewarded hint request failed; no hint granted.', error);
      this.analytics.rewardedResult('unavailable', context);
      this.analytics.techError('rewarded_request_failed', 'ads', {
        mode: context.mode,
        puzzleId: context.puzzleId,
      });
      return 'unavailable';
    }
  }

  async maybeShowCampaignInterstitial(completedSlot: number): Promise<void> {
    const nowMs = this.now();
    const state = this.profileService.getProfile().ads;
    if (!isInterstitialEligible({ completedSlot, state, nowMs })) return;

    this.profileService.consumeCampaignInterstitialOpportunity();

    let result: Awaited<ReturnType<AdsPort['showInterstitial']>>;
    try {
      result = await this.ads.showInterstitial();
      this.analytics.interstitialResult(result, completedSlot);
    } catch (error) {
      console.warn('[Dungeon Logic] Interstitial request failed; continuing campaign navigation.', error);
      this.analytics.interstitialResult('unavailable', completedSlot);
      this.analytics.techError('interstitial_request_failed', 'ads');
      this.flushSoon('after failed campaign interstitial request');
      return;
    }

    if (result === 'shown') {
      this.profileService.recordInterstitialShown(this.now());
    }
    this.flushSoon('after campaign interstitial opportunity');
  }

  private flushSoon(context: string): void {
    void this.profileService.flush().catch((error) => {
      console.warn(`[Dungeon Logic] Could not persist monetization state ${context}; keeping dirty in-memory state.`, error);
    });
  }
}

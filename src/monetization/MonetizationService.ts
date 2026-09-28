import type { AnalyticsPuzzleContext } from '../analytics/AnalyticsService';
import { AnalyticsService } from '../analytics/AnalyticsService';
import type { AdsPort, RewardedResult } from '../platform/services';

export class MonetizationService {
  private readonly ads: AdsPort;
  private readonly analytics: AnalyticsService;

  private constructor(
    ads: AdsPort,
    analytics: AnalyticsService,
  ) {
    this.ads = ads;
    this.analytics = analytics;
  }

  static create(
    ads: AdsPort,
    analytics: AnalyticsService,
  ): MonetizationService {
    return new MonetizationService(ads, analytics);
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
}

import type { AdsPort } from '../platform/services';
import type { PlayerProfileService } from '../profile/PlayerProfileService';
import { isInterstitialEligible } from './InterstitialPolicy';

export type MonetizationNow = () => number;

export class MonetizationService {
  private readonly profileService: PlayerProfileService;
  private readonly ads: AdsPort;
  private readonly now: MonetizationNow;

  private constructor(
    profileService: PlayerProfileService,
    ads: AdsPort,
    now: MonetizationNow,
  ) {
    this.profileService = profileService;
    this.ads = ads;
    this.now = now;
  }

  static create(
    profileService: PlayerProfileService,
    ads: AdsPort,
    now: MonetizationNow = () => Date.now(),
  ): MonetizationService {
    return new MonetizationService(profileService, ads, now);
  }

  async maybeShowCampaignInterstitial(completedSlot: number): Promise<void> {
    const nowMs = this.now();
    const state = this.profileService.getProfile().ads;
    if (!isInterstitialEligible({ completedSlot, state, nowMs })) return;

    this.profileService.consumeCampaignInterstitialOpportunity();

    let result: Awaited<ReturnType<AdsPort['showInterstitial']>>;
    try {
      result = await this.ads.showInterstitial();
    } catch (error) {
      console.warn('[Dungeon Logic] Interstitial request failed; continuing campaign navigation.', error);
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

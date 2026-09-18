import type { TechnicalErrorReporter } from '../analytics/AnalyticsService';
import type { CampaignLevelEntry } from '../content/campaign/types';
import type { SupportedLanguage } from '../i18n/Language';
import { calculateHintRecharge, MAX_FREE_HINTS, type HintRechargeStatus } from '../gameplay/HintEconomy';
import {
  createFreshPlayerProfile,
  migrateLegacyCampaignProgress,
  normalizePlayerProfile,
} from './PlayerProfile';
import type { PlayerProfileStorage } from './PlayerProfileStorage';
import type { PlayerProfileV6 } from './types';

export const PLAYER_PROFILE_SERVICE_REGISTRY_KEY = 'player-profile-service';

export interface PlayerProfileServiceOptions {
  readonly saveDelayMs?: number;
  readonly defaultLanguage?: SupportedLanguage;
  readonly reportTechnicalError?: TechnicalErrorReporter;
}

export class PlayerProfileService {
  private readonly manifest: readonly CampaignLevelEntry[];
  private readonly storage: PlayerProfileStorage;
  private readonly saveDelayMs: number;
  private readonly defaultLanguage: SupportedLanguage;
  private readonly reportTechnicalError: TechnicalErrorReporter;

  private profile: PlayerProfileV6;
  private dirty = false;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private flushPromise: Promise<void> | null = null;

  private constructor(
    manifest: readonly CampaignLevelEntry[],
    storage: PlayerProfileStorage,
    profile: PlayerProfileV6,
    saveDelayMs: number,
    defaultLanguage: SupportedLanguage,
    reportTechnicalError: TechnicalErrorReporter,
  ) {
    this.manifest = manifest;
    this.storage = storage;
    this.profile = profile;
    this.saveDelayMs = saveDelayMs;
    this.defaultLanguage = defaultLanguage;
    this.reportTechnicalError = reportTechnicalError;
  }

  static async create(
    manifest: readonly CampaignLevelEntry[],
    storage: PlayerProfileStorage,
    options: PlayerProfileServiceOptions = {},
  ): Promise<PlayerProfileService> {
    const saveDelayMs = Math.max(0, options.saveDelayMs ?? 5000);
    const defaultLanguage = options.defaultLanguage ?? 'ru';
    const reportTechnicalError = options.reportTechnicalError ?? (() => {});

    let loaded: unknown | null = null;
    try {
      loaded = await storage.load();
    } catch (error) {
      reportTechnicalError('profile_load_failed', 'profile');
      console.warn('[Dungeon Logic] Could not load player profile; checking legacy progress.', error);
    }

    if (loaded !== null) {
      return new PlayerProfileService(
        manifest,
        storage,
        normalizePlayerProfile(loaded, manifest, defaultLanguage),
        saveDelayMs,
        defaultLanguage,
        reportTechnicalError,
      );
    }

    let legacy: unknown | null = null;
    if (storage.loadLegacyCampaignProgress !== undefined) {
      try {
        legacy = await storage.loadLegacyCampaignProgress();
      } catch (error) {
        reportTechnicalError('profile_load_failed', 'profile');
        console.warn('[Dungeon Logic] Could not load legacy campaign progress; starting fresh.', error);
      }
    }

    const profile = legacy === null
      ? createFreshPlayerProfile(manifest, defaultLanguage)
      : migrateLegacyCampaignProgress(legacy, manifest, defaultLanguage);
    const service = new PlayerProfileService(
      manifest,
      storage,
      profile,
      saveDelayMs,
      defaultLanguage,
      reportTechnicalError,
    );

    if (legacy !== null) {
      try {
        await storage.save(profile);
      } catch (error) {
        reportTechnicalError('profile_save_failed', 'profile');
        service.dirty = true;
        service.scheduleSave();
        console.warn('[Dungeon Logic] Could not persist migrated player profile immediately; retry scheduled.', error);
      }
    }

    return service;
  }

  getProfile(): PlayerProfileV6 {
    return this.profile;
  }

  update(
    mutator: (profile: PlayerProfileV6) => PlayerProfileV6,
  ): PlayerProfileV6 {
    const safeCurrent = normalizePlayerProfile(this.profile, this.manifest, this.defaultLanguage);
    const candidate = mutator(safeCurrent);
    this.profile = normalizePlayerProfile(candidate, this.manifest, this.defaultLanguage);
    this.dirty = true;
    this.scheduleSave();
    return this.profile;
  }

  getHintRechargeStatus(nowMs = Date.now()): HintRechargeStatus {
    const current = calculateHintRecharge({
      freeRemaining: this.profile.hints.freeRemaining,
      rechargeAnchorMs: this.profile.hints.rechargeAnchorMs ?? null,
    }, nowMs);
    if (
      current.freeRemaining !== this.profile.hints.freeRemaining
      || current.rechargeAnchorMs !== (this.profile.hints.rechargeAnchorMs ?? null)
    ) {
      this.update((profile) => ({
        ...profile,
        hints: {
          ...profile.hints,
          freeRemaining: current.freeRemaining,
          rechargeAnchorMs: current.rechargeAnchorMs,
        },
      }));
    }
    return current;
  }

  getFreeHintsRemaining(nowMs = Date.now()): number {
    return this.getHintRechargeStatus(nowMs).freeRemaining;
  }

  consumeFreeHint(nowMs = Date.now()): boolean {
    const status = this.getHintRechargeStatus(nowMs);
    if (status.freeRemaining <= 0) return false;
    const nextRemaining = status.freeRemaining - 1;
    const nextAnchor = nextRemaining < MAX_FREE_HINTS
      ? (status.rechargeAnchorMs ?? Math.max(0, Math.floor(nowMs)))
      : null;

    this.update((profile) => ({
      ...profile,
      hints: {
        ...profile.hints,
        freeRemaining: nextRemaining,
        rechargeAnchorMs: nextAnchor,
        totalUsed: profile.hints.totalUsed + 1,
      },
    }));
    return true;
  }

  recordRewardedHintUsed(): void {
    this.update((profile) => ({
      ...profile,
      hints: {
        ...profile.hints,
        totalUsed: profile.hints.totalUsed + 1,
      },
    }));
  }

  addActivePlayTime(ms: number): void {
    if (!Number.isFinite(ms) || ms <= 0) return;

    this.update((profile) => ({
      ...profile,
      totals: {
        activePlayMs: profile.totals.activePlayMs + ms,
      },
    }));
  }

  recordCampaignCompletionForInterstitial(completedSlot: number): void {
    if (!Number.isInteger(completedSlot) || completedSlot <= 5) return;

    this.update((profile) => ({
      ...profile,
      ads: {
        ...profile.ads,
        campaignCompletionsSinceOpportunity:
          profile.ads.campaignCompletionsSinceOpportunity + 1,
      },
    }));
  }

  consumeCampaignInterstitialOpportunity(): void {
    this.update((profile) => ({
      ...profile,
      ads: {
        ...profile.ads,
        campaignCompletionsSinceOpportunity: 0,
      },
    }));
  }

  recordInterstitialShown(atMs: number): void {
    if (!Number.isFinite(atMs) || atMs < 0) return;

    this.update((profile) => ({
      ...profile,
      ads: {
        ...profile.ads,
        lastInterstitialAtMs: atMs,
      },
    }));
  }

  replaceProfileForPlatformMerge(profile: PlayerProfileV6): PlayerProfileV6 {
    this.profile = normalizePlayerProfile(profile, this.manifest, this.defaultLanguage);
    this.dirty = true;
    this.scheduleSave();
    return this.profile;
  }

  async flush(): Promise<void> {
    if (this.saveTimer !== null) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }

    if (this.flushPromise !== null) return this.flushPromise;
    if (!this.dirty) return;

    this.flushPromise = this.performFlush().finally(() => {
      this.flushPromise = null;
    });
    return this.flushPromise;
  }

  private scheduleSave(): void {
    if (this.saveTimer !== null) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      void this.flush().catch((error) => {
        this.reportTechnicalError('profile_save_failed', 'profile');
        console.warn('[Dungeon Logic] Could not persist player profile; keeping dirty in-memory state.', error);
      });
    }, this.saveDelayMs);
  }

  private async performFlush(): Promise<void> {
    while (this.dirty) {
      this.dirty = false;
      const snapshot = this.profile;
      try {
        await this.storage.save(snapshot);
      } catch (error) {
        this.dirty = true;
        this.reportTechnicalError('profile_save_failed', 'profile');
        throw error;
      }
    }
  }
}

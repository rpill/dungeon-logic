import type { TechnicalErrorReporter } from '../analytics/AnalyticsService';
import type { PlayerStorage } from '../platform/services';
import { isSupportedPlayerProfile } from './PlayerProfile';
import type { PlayerProfileStorage, ScopedProfileSnapshot } from './PlayerProfileStorage';
import type { PlayerProfile } from './types';

const LOCAL_SCOPE = 'browser-local';

function canMergeFallbackScope(sourceScope: string | null, targetScope: string | null): boolean {
  if (sourceScope === null && targetScope === null) return true;
  if (sourceScope === null || targetScope === null) return false;
  if (sourceScope === targetScope) return true;
  if (sourceScope === LOCAL_SCOPE && targetScope.startsWith('yandex-')) return true;
  const sourceIsGuest = sourceScope.startsWith('yandex-guest-');
  const targetIsAccount = targetScope.startsWith('yandex-account-');
  return sourceIsGuest && targetIsAccount;
}

export class PlatformPlayerProfileStorage implements PlayerProfileStorage {
  private readonly platformStorage: PlayerStorage;
  private readonly localFallbackStorage: PlayerProfileStorage | undefined;
  private readonly reportTechnicalError: TechnicalErrorReporter;
  private primaryWritesBlocked = false;
  private currentScope: string | null = null;
  private pendingMergeSource: unknown | null = null;

  constructor(
    platformStorage: PlayerStorage,
    localFallbackStorage?: PlayerProfileStorage,
    reportTechnicalError: TechnicalErrorReporter = () => {},
  ) {
    this.platformStorage = platformStorage;
    this.localFallbackStorage = localFallbackStorage;
    this.reportTechnicalError = reportTechnicalError;
  }

  private async readPlatformScope(): Promise<string | null> {
    if (this.platformStorage.scope === undefined) return null;
    try {
      const scope = (await this.platformStorage.scope()).trim();
      return scope.length > 0 ? scope : null;
    } catch (error) {
      console.warn('[Dungeon Logic] Could not resolve platform player scope.', error);
      return null;
    }
  }

  private async loadFallbackSnapshot(): Promise<ScopedProfileSnapshot> {
    if (this.localFallbackStorage === undefined) return { scope: null, profile: null };
    if (this.localFallbackStorage.loadScoped !== undefined) {
      return this.localFallbackStorage.loadScoped();
    }
    return { scope: null, profile: await this.localFallbackStorage.load() };
  }

  private async cacheForCurrentScope(profile: PlayerProfile): Promise<void> {
    if (this.localFallbackStorage === undefined) return;
    if (this.currentScope !== null && this.localFallbackStorage.saveForScope !== undefined) {
      await this.localFallbackStorage.saveForScope(profile, this.currentScope);
      return;
    }
    if (this.currentScope === null && this.platformStorage.scope !== undefined) {
      // The platform supports identity scoping, but its identity is temporarily
      // unresolved. Do not overwrite a cache that may belong to another account.
      return;
    }
    await this.localFallbackStorage.save(profile);
  }

  async load(): Promise<unknown | null> {
    const targetScope = await this.readPlatformScope();
    const fallback = await this.loadFallbackSnapshot();
    this.pendingMergeSource = null;

    let platformValue: unknown | null;
    try {
      platformValue = await this.platformStorage.load();
      this.primaryWritesBlocked = false;
      this.currentScope = targetScope;
    } catch (error) {
      this.primaryWritesBlocked = true;
      this.currentScope = targetScope;
      this.reportTechnicalError('profile_load_failed', 'profile');
      console.warn('[Dungeon Logic] Could not load platform player profile; checking same-scope local fallback.', error);
      if (fallback.profile === null) return null;
      if (this.platformStorage.scope !== undefined && targetScope === null) return null;
      if (targetScope !== null && fallback.scope !== targetScope) return null;
      return fallback.profile;
    }

    const fallbackCanMerge = fallback.profile !== null
      && canMergeFallbackScope(fallback.scope, targetScope);
    if (fallbackCanMerge) this.pendingMergeSource = fallback.profile;

    if (platformValue !== null) {
      if (!fallbackCanMerge && targetScope !== null && isSupportedPlayerProfile(platformValue)) {
        try {
          await this.cacheForCurrentScope(platformValue as unknown as PlayerProfile);
        } catch (error) {
          console.warn('[Dungeon Logic] Could not refresh local account profile cache.', error);
        }
      }
      return platformValue;
    }

    if (fallbackCanMerge && targetScope === null && fallback.scope === null) {
      if (isSupportedPlayerProfile(fallback.profile)) {
        try {
          await this.platformStorage.save(fallback.profile);
        } catch (error) {
          this.reportTechnicalError('profile_save_failed', 'profile');
          console.warn('[Dungeon Logic] Could not promote local player profile into platform storage yet.', error);
        }
      }
      this.pendingMergeSource = null;
      return fallback.profile;
    }
    if (fallbackCanMerge) return null;
    return null;
  }

  async loadMergeSource(): Promise<unknown | null> {
    const source = this.pendingMergeSource;
    this.pendingMergeSource = null;
    return source;
  }

  async loadPrimary(): Promise<unknown | null> {
    const nextScope = await this.readPlatformScope();
    try {
      const value = await this.platformStorage.load();
      this.currentScope = nextScope;
      this.primaryWritesBlocked = false;
      return value;
    } catch (error) {
      this.primaryWritesBlocked = true;
      this.reportTechnicalError('profile_load_failed', 'profile');
      throw error;
    }
  }

  prepareForAccountTransition(): void {
    this.primaryWritesBlocked = true;
  }

  cancelAccountTransition(): void {
    this.primaryWritesBlocked = false;
  }

  async save(profile: PlayerProfile): Promise<void> {
    if (this.primaryWritesBlocked) {
      if (this.localFallbackStorage !== undefined) {
        if (this.currentScope !== null && this.localFallbackStorage.saveForScope !== undefined) {
          await this.localFallbackStorage.saveForScope(profile, this.currentScope);
        } else {
          await this.localFallbackStorage.save(profile);
        }
        return;
      }
      throw new Error('Platform profile writes are blocked until the current account profile is loaded.');
    }

    if (this.currentScope === null) this.currentScope = await this.readPlatformScope();
    await this.platformStorage.save(profile);
    await this.cacheForCurrentScope(profile);
  }
}

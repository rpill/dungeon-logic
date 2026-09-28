import type { PlayerProfileStorage, ScopedProfileSnapshot } from './PlayerProfileStorage';
import type { PlayerProfile } from './types';

export const PLAYER_PROFILE_STORAGE_KEY = 'dungeon-logic:player-profile-cache:v2';
export const LEGACY_PLAYER_PROFILE_STORAGE_KEY = 'dungeon-logic:player-profile:v1';
const DEFAULT_LOCAL_SCOPE = 'browser-local';

interface ScopedLocalProfileEnvelope {
  readonly storageVersion: 2;
  readonly scope: string;
  readonly profile: PlayerProfile;
}

export interface ProfileKeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function decodeEnvelope(value: unknown): ScopedProfileSnapshot | null {
  if (!isRecord(value) || value.storageVersion !== 2) return null;
  if (typeof value.scope !== 'string' || value.scope.length === 0) return null;
  if (!('profile' in value)) return null;
  return { scope: value.scope, profile: value.profile };
}

export class LocalPlayerProfileStorage implements PlayerProfileStorage {
  private readonly storage: ProfileKeyValueStorage | null;
  private memoryProfileValue: string | null = null;
  private memoryLegacyValue: string | null = null;
  private warned = false;

  constructor(storage?: ProfileKeyValueStorage | null) {
    if (storage !== undefined) {
      this.storage = storage;
      return;
    }

    let resolved: ProfileKeyValueStorage | null = null;
    try {
      resolved = globalThis.localStorage ?? null;
    } catch (error) {
      this.warnOnce('localStorage is unavailable; player profile will be kept in memory.', error);
    }
    this.storage = resolved;
  }

  async loadScoped(): Promise<ScopedProfileSnapshot> {
    let serialized = this.memoryProfileValue;
    let legacySerialized = this.memoryLegacyValue;

    if (this.storage !== null) {
      try {
        const stored = this.storage.getItem(PLAYER_PROFILE_STORAGE_KEY);
        if (stored !== null) {
          serialized = stored;
          this.memoryProfileValue = stored;
        }
        if (serialized === null) {
          const legacy = this.storage.getItem(LEGACY_PLAYER_PROFILE_STORAGE_KEY);
          if (legacy !== null) {
            legacySerialized = legacy;
            this.memoryLegacyValue = legacy;
          }
        }
      } catch (error) {
        this.warnOnce('Could not read player profile from localStorage; using in-memory data.', error);
      }
    }

    if (serialized !== null) {
      try {
        const decoded = decodeEnvelope(JSON.parse(serialized) as unknown);
        if (decoded !== null) return decoded;
      } catch (error) {
        this.warnOnce('Could not parse player profile cache; ignoring invalid stored data.', error);
      }
    }

    if (legacySerialized !== null) {
      try {
        return { scope: DEFAULT_LOCAL_SCOPE, profile: JSON.parse(legacySerialized) as unknown };
      } catch (error) {
        this.warnOnce('Could not parse legacy player profile; ignoring invalid stored data.', error);
      }
    }

    return { scope: null, profile: null };
  }

  async load(): Promise<unknown | null> {
    return (await this.loadScoped()).profile;
  }

  async saveForScope(profile: PlayerProfile, scope: string): Promise<void> {
    const safeScope = scope.trim().length > 0 ? scope : DEFAULT_LOCAL_SCOPE;
    const envelope: ScopedLocalProfileEnvelope = {
      storageVersion: 2,
      scope: safeScope,
      profile,
    };
    const serialized = JSON.stringify(envelope);
    this.memoryProfileValue = serialized;

    if (this.storage === null) {
      this.warnOnce('localStorage is unavailable; player profile will be kept in memory.');
      return;
    }

    try {
      this.storage.setItem(PLAYER_PROFILE_STORAGE_KEY, serialized);
    } catch (error) {
      this.warnOnce('Could not persist player profile to localStorage; keeping it in memory.', error);
    }
  }

  async save(profile: PlayerProfile): Promise<void> {
    const current = await this.loadScoped();
    await this.saveForScope(profile, current.scope ?? DEFAULT_LOCAL_SCOPE);
  }

  private warnOnce(message: string, error?: unknown): void {
    if (this.warned) return;
    this.warned = true;
    if (error === undefined) console.warn(`[Dungeon Logic] ${message}`);
    else console.warn(`[Dungeon Logic] ${message}`, error);
  }
}

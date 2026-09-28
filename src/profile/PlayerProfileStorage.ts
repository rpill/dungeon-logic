import type { PlayerProfile } from './types';

export interface ScopedProfileSnapshot {
  readonly scope: string | null;
  readonly profile: unknown | null;
}

export interface PlayerProfileStorage {
  load(): Promise<unknown | null>;
  save(profile: PlayerProfile): Promise<void>;
  /** Optional local-cache metadata used to keep Yandex accounts isolated. */
  loadScoped?(): Promise<ScopedProfileSnapshot>;
  saveForScope?(profile: PlayerProfile, scope: string): Promise<void>;
  /** Optional profile that should be merged into the primary profile after load(). */
  loadMergeSource?(): Promise<unknown | null>;

  /** Optional primary-only read used after a platform account identity changes. */
  loadPrimary?(): Promise<unknown | null>;
  /** Blocks primary writes until the post-authorization primary profile has been read. */
  prepareForAccountTransition?(): void;
  /** Restores ordinary writes when authorization was cancelled or failed before identity changed. */
  cancelAccountTransition?(): void;
}

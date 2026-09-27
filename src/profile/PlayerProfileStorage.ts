import type { PlayerProfile } from './types';

export interface PlayerProfileStorage {
  load(): Promise<unknown | null>;
  save(profile: PlayerProfile): Promise<void>;

  /** Optional primary-only read used after a platform account identity changes. */
  loadPrimary?(): Promise<unknown | null>;
  /** Blocks primary writes until the post-authorization primary profile has been read. */
  prepareForAccountTransition?(): void;
  /** Restores ordinary writes when authorization was cancelled or failed before identity changed. */
  cancelAccountTransition?(): void;
}

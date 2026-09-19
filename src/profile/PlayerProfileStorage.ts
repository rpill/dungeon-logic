import type { PlayerProfile } from './types';

export interface PlayerProfileStorage {
  load(): Promise<unknown | null>;
  save(profile: PlayerProfile): Promise<void>;
}

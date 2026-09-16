import type { PlayerProfileV5 } from './types';

export interface PlayerProfileStorage {
  load(): Promise<unknown | null>;
  save(profile: PlayerProfileV5): Promise<void>;
  loadLegacyCampaignProgress?(): Promise<unknown | null>;
}

import type { PlayerProfileV4 } from './types';

export interface PlayerProfileStorage {
  load(): Promise<unknown | null>;
  save(profile: PlayerProfileV4): Promise<void>;
  loadLegacyCampaignProgress?(): Promise<unknown | null>;
}

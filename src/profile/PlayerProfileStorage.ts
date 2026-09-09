import type { PlayerProfileV2 } from './types';

export interface PlayerProfileStorage {
  load(): Promise<unknown | null>;
  save(profile: PlayerProfileV2): Promise<void>;
  loadLegacyCampaignProgress?(): Promise<unknown | null>;
}

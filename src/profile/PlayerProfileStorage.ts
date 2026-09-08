import type { PlayerProfileV1 } from './types';

export interface PlayerProfileStorage {
  load(): Promise<unknown | null>;
  save(profile: PlayerProfileV1): Promise<void>;
  loadLegacyCampaignProgress?(): Promise<unknown | null>;
}

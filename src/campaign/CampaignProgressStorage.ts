import type { CampaignProgressV1 } from './types';

export interface CampaignProgressStorage {
  load(): Promise<CampaignProgressV1 | null>;
  save(progress: CampaignProgressV1): Promise<void>;
}

import type { PromotedCampaignLevelSource } from '../types';
import { level as campaign001, provenance as campaign001Provenance } from './campaign001';
import { level as campaign002, provenance as campaign002Provenance } from './campaign002';
import { level as campaign003, provenance as campaign003Provenance } from './campaign003';
import { level as campaign004, provenance as campaign004Provenance } from './campaign004';
import { level as campaign005, provenance as campaign005Provenance } from './campaign005';

export const promotedCampaignLevels = [
  { slot: 1, level: campaign001, provenance: campaign001Provenance },
  { slot: 2, level: campaign002, provenance: campaign002Provenance },
  { slot: 3, level: campaign003, provenance: campaign003Provenance },
  { slot: 4, level: campaign004, provenance: campaign004Provenance },
  { slot: 5, level: campaign005, provenance: campaign005Provenance },
] as const satisfies readonly PromotedCampaignLevelSource[];

import type { PromotedCampaignLevelSource } from '../types';
import { level as campaign001, provenance as campaign001Provenance } from './campaign001';
import { level as campaign002, provenance as campaign002Provenance } from './campaign002';
import { level as campaign003, provenance as campaign003Provenance } from './campaign003';
import { level as campaign004, provenance as campaign004Provenance } from './campaign004';
import { level as campaign005, provenance as campaign005Provenance } from './campaign005';
import { level as campaign006, provenance as campaign006Provenance } from './campaign006';
import { level as campaign007, provenance as campaign007Provenance } from './campaign007';
import { level as campaign008, provenance as campaign008Provenance } from './campaign008';
import { level as campaign009, provenance as campaign009Provenance } from './campaign009';
import { level as campaign010, provenance as campaign010Provenance } from './campaign010';
import { level as campaign011, provenance as campaign011Provenance } from './campaign011';
import { level as campaign012, provenance as campaign012Provenance } from './campaign012';
import { level as campaign013, provenance as campaign013Provenance } from './campaign013';
import { level as campaign014, provenance as campaign014Provenance } from './campaign014';
import { level as campaign015, provenance as campaign015Provenance } from './campaign015';
import { level as campaign016, provenance as campaign016Provenance } from './campaign016';
import { level as campaign017, provenance as campaign017Provenance } from './campaign017';
import { level as campaign018, provenance as campaign018Provenance } from './campaign018';
import { level as campaign019, provenance as campaign019Provenance } from './campaign019';
import { level as campaign020, provenance as campaign020Provenance } from './campaign020';
import { level as campaign021, provenance as campaign021Provenance } from './campaign021';
import { level as campaign022, provenance as campaign022Provenance } from './campaign022';
import { level as campaign023, provenance as campaign023Provenance } from './campaign023';
import { level as campaign024, provenance as campaign024Provenance } from './campaign024';
import { level as campaign025, provenance as campaign025Provenance } from './campaign025';
import { level as campaign026, provenance as campaign026Provenance } from './campaign026';
import { level as campaign027, provenance as campaign027Provenance } from './campaign027';
import { level as campaign028, provenance as campaign028Provenance } from './campaign028';
import { level as campaign029, provenance as campaign029Provenance } from './campaign029';
import { level as campaign030, provenance as campaign030Provenance } from './campaign030';

export const promotedCampaignLevels = [
  { slot: 1, level: campaign001, provenance: campaign001Provenance },
  { slot: 2, level: campaign002, provenance: campaign002Provenance },
  { slot: 3, level: campaign003, provenance: campaign003Provenance },
  { slot: 4, level: campaign004, provenance: campaign004Provenance },
  { slot: 5, level: campaign005, provenance: campaign005Provenance },
  { slot: 6, level: campaign006, provenance: campaign006Provenance },
  { slot: 7, level: campaign007, provenance: campaign007Provenance },
  { slot: 8, level: campaign008, provenance: campaign008Provenance },
  { slot: 9, level: campaign009, provenance: campaign009Provenance },
  { slot: 10, level: campaign010, provenance: campaign010Provenance },
  { slot: 11, level: campaign011, provenance: campaign011Provenance },
  { slot: 12, level: campaign012, provenance: campaign012Provenance },
  { slot: 13, level: campaign013, provenance: campaign013Provenance },
  { slot: 14, level: campaign014, provenance: campaign014Provenance },
  { slot: 15, level: campaign015, provenance: campaign015Provenance },
  { slot: 16, level: campaign016, provenance: campaign016Provenance },
  { slot: 17, level: campaign017, provenance: campaign017Provenance },
  { slot: 18, level: campaign018, provenance: campaign018Provenance },
  { slot: 19, level: campaign019, provenance: campaign019Provenance },
  { slot: 20, level: campaign020, provenance: campaign020Provenance },
  { slot: 21, level: campaign021, provenance: campaign021Provenance },
  { slot: 22, level: campaign022, provenance: campaign022Provenance },
  { slot: 23, level: campaign023, provenance: campaign023Provenance },
  { slot: 24, level: campaign024, provenance: campaign024Provenance },
  { slot: 25, level: campaign025, provenance: campaign025Provenance },
  { slot: 26, level: campaign026, provenance: campaign026Provenance },
  { slot: 27, level: campaign027, provenance: campaign027Provenance },
  { slot: 28, level: campaign028, provenance: campaign028Provenance },
  { slot: 29, level: campaign029, provenance: campaign029Provenance },
  { slot: 30, level: campaign030, provenance: campaign030Provenance },
] as const satisfies readonly PromotedCampaignLevelSource[];

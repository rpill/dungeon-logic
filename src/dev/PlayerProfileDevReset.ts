import type { CampaignLevelEntry } from '../content/campaign/types';
import { createFreshPlayerProfile } from '../profile/PlayerProfile';
import type { PlayerProfile } from '../profile/types';

export function resetPlayerProfileForDev(
  profile: PlayerProfile,
  campaignLevels: readonly CampaignLevelEntry[],
): PlayerProfile {
  const fresh = createFreshPlayerProfile(campaignLevels, profile.settings.language);
  return {
    ...fresh,
    settings: profile.settings,
  };
}

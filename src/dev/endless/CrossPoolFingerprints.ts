import {
  promotedCampaignLevels,
} from '../../content/campaign/levels';
import {
  campaignReleaseStructuralFingerprint,
} from '../../content/release/CampaignReleaseSelection';
import { DAILY_PRODUCTION_ENTRIES } from '../DailyProductionCatalog';

export interface EndlessCrossPoolFingerprints {
  readonly campaign: ReadonlySet<string>;
  readonly daily: ReadonlySet<string>;
}

export function buildCrossPoolFingerprints(): EndlessCrossPoolFingerprints {
  const campaign = new Set<string>();
  for (const source of promotedCampaignLevels) {
    addUniqueFingerprint(
      campaign,
      campaignReleaseStructuralFingerprint(source.level.solution),
      `Campaign level ${source.slot}`,
    );
  }

  const daily = new Set<string>();
  for (const entry of DAILY_PRODUCTION_ENTRIES) {
    addUniqueFingerprint(
      daily,
      campaignReleaseStructuralFingerprint(entry.level.solution),
      `Daily ${entry.dateKey}`,
    );
  }

  return { campaign, daily };
}

function addUniqueFingerprint(target: Set<string>, fingerprint: string, label: string): void {
  if (target.has(fingerprint)) throw new Error(`${label} duplicates an existing structural fingerprint.`);
  target.add(fingerprint);
}

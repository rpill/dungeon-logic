import {
  CAMPAIGN_MANUSCRIPTS,
  getManuscriptDefinition,
} from '../content/campaign/manuscripts';
import type {
  CampaignLevelEntry,
  ManuscriptDefinition,
  ManuscriptId,
} from '../content/campaign/types';

const ONBOARDING_LAST_SLOT = 5;
const FRONTIER_SIZE = 3;

function campaignIdForSlot(slot: number): string {
  return `campaign-${String(slot).padStart(3, '0')}`;
}

function entriesForManuscript(
  manifest: readonly CampaignLevelEntry[],
  manuscript: ManuscriptDefinition,
): readonly CampaignLevelEntry[] {
  const slots = new Set(manuscript.slots);
  return manifest
    .filter((entry) => slots.has(entry.slot))
    .slice()
    .sort((left, right) => left.slot - right.slot);
}

function solvedCountForManuscript(
  manuscript: ManuscriptDefinition,
  completed: ReadonlySet<string>,
  manifest: readonly CampaignLevelEntry[],
): number {
  return entriesForManuscript(manifest, manuscript)
    .filter((entry) => completed.has(entry.id))
    .length;
}

export function isManuscriptUnlocked(
  id: ManuscriptId,
  completedIds: readonly string[],
  manifest: readonly CampaignLevelEntry[],
): boolean {
  const target = getManuscriptDefinition(id);
  const targetIndex = CAMPAIGN_MANUSCRIPTS.findIndex((entry) => entry.id === target.id);
  const completed = new Set(completedIds);

  for (let index = 1; index <= targetIndex; index += 1) {
    const manuscript = CAMPAIGN_MANUSCRIPTS[index];
    const previous = CAMPAIGN_MANUSCRIPTS[index - 1];
    if (
      solvedCountForManuscript(previous, completed, manifest)
      < manuscript.requiredPreviousSolved
    ) {
      return false;
    }
  }

  return true;
}

function getManuscriptFrontier(
  manuscript: ManuscriptDefinition,
  manifest: readonly CampaignLevelEntry[],
  completed: ReadonlySet<string>,
): readonly CampaignLevelEntry[] {
  const entries = entriesForManuscript(manifest, manuscript);

  if (manuscript.id === 'manuscript-i') {
    const nextOnboardingSlot = manuscript.slots
      .filter((slot) => slot <= ONBOARDING_LAST_SLOT)
      .find((slot) => !completed.has(campaignIdForSlot(slot)));

    if (nextOnboardingSlot !== undefined) {
      const promotedEntry = entries.find((entry) => entry.slot === nextOnboardingSlot);
      return promotedEntry === undefined ? [] : [promotedEntry];
    }
  }

  return entries
    .filter((entry) => !completed.has(entry.id))
    .slice(0, FRONTIER_SIZE);
}

export function getPlayableCampaignIds(
  manifest: readonly CampaignLevelEntry[],
  completedIds: readonly string[],
): readonly string[] {
  const completed = new Set(completedIds);
  const frontier = new Set<string>();

  for (const manuscript of CAMPAIGN_MANUSCRIPTS) {
    if (!isManuscriptUnlocked(manuscript.id, completedIds, manifest)) {
      continue;
    }

    for (const entry of getManuscriptFrontier(manuscript, manifest, completed)) {
      frontier.add(entry.id);
    }
  }

  return manifest
    .slice()
    .sort((left, right) => left.slot - right.slot)
    .filter((entry) => completed.has(entry.id) || frontier.has(entry.id))
    .map((entry) => entry.id);
}

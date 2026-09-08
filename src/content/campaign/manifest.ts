import { getCampaignChapterForSlot } from './chapters';
import { getCampaignCurationRule } from './curationPlan';
import { getManuscriptForSlot } from './manuscripts';
import { promotedCampaignLevels } from './levels';
import type {
  CampaignLevelEntry,
  PromotedCampaignLevelSource,
} from './types';

function expectedCampaignId(slot: number): string {
  return `campaign-${String(slot).padStart(3, '0')}`;
}

export function validateCampaignManifest(entries: readonly CampaignLevelEntry[]): void {
  const seenSlots = new Set<number>();
  const seenIds = new Set<string>();

  entries.forEach((entry, index) => {
    const expectedSlot = index + 1;
    if (!Number.isInteger(entry.slot) || entry.slot <= 0) {
      throw new Error(`Campaign slot must be a positive integer: ${entry.slot}.`);
    }
    if (entry.slot !== expectedSlot) {
      throw new Error(
        `Promoted campaign slots must be contiguous and ordered from 1; expected ${expectedSlot}, got ${entry.slot}.`,
      );
    }
    if (seenSlots.has(entry.slot)) {
      throw new Error(`Duplicate campaign slot: ${entry.slot}.`);
    }
    seenSlots.add(entry.slot);

    if (seenIds.has(entry.id)) {
      throw new Error(`Duplicate campaign id: ${entry.id}.`);
    }
    seenIds.add(entry.id);

    const expectedId = expectedCampaignId(entry.slot);
    if (entry.id !== expectedId) {
      throw new Error(`Campaign slot ${entry.slot} must use id ${expectedId}; got ${entry.id}.`);
    }
    if (entry.level.id !== entry.id) {
      throw new Error(`Campaign entry ${entry.id} must match level id ${entry.level.id}.`);
    }

    const chapter = getCampaignChapterForSlot(entry.slot);
    if (entry.chapterId !== chapter.id) {
      throw new Error(
        `Campaign slot ${entry.slot} belongs to chapter ${chapter.id}, not ${entry.chapterId}.`,
      );
    }
  });
}

export function buildCampaignManifest(
  registry: readonly PromotedCampaignLevelSource[],
): readonly CampaignLevelEntry[] {
  const entries = registry.map((source) => {
    const expectedId = expectedCampaignId(source.slot);
    if (source.level.id !== expectedId) {
      throw new Error(
        `Promoted source for slot ${source.slot} must have level id ${expectedId}; got ${source.level.id}.`,
      );
    }

    const curation = getCampaignCurationRule(source.slot);
    const chapter = getCampaignChapterForSlot(source.slot);
    if (curation.chapterId !== chapter.id) {
      throw new Error(
        `Curation rule for slot ${source.slot} points to ${curation.chapterId}, but chapter ownership is ${chapter.id}.`,
      );
    }

    const manuscript = getManuscriptForSlot(source.slot);
    if (manuscript === null || curation.manuscriptId !== manuscript.id) {
      throw new Error(
        `Curation rule for slot ${source.slot} points to manuscript ${curation.manuscriptId}, but manuscript ownership is ${manuscript?.id ?? 'none'}.`,
      );
    }

    return {
      slot: source.slot,
      id: expectedId,
      level: source.level,
      chapterId: chapter.id,
      onboarding: curation.onboarding,
    } satisfies CampaignLevelEntry;
  });

  validateCampaignManifest(entries);
  return entries;
}

export const campaignManifest: readonly CampaignLevelEntry[] =
  buildCampaignManifest(promotedCampaignLevels);

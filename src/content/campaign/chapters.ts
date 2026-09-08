import type {
  CampaignChapterDefinition,
  CampaignChapterId,
} from './types';

function range(start: number, end: number): readonly number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export const campaignChapters = [
  { id: 'graveyard', title: 'Overgrown Graveyard', themeId: 'graveyard', slots: range(1, 6) },
  { id: 'desert-ruins', title: 'Desert Ruins', themeId: 'desert-ruins', slots: range(7, 13) },
  { id: 'sewers', title: 'Sewers', themeId: 'sewers', slots: range(14, 22) },
  { id: 'crypt', title: 'Crypt', themeId: 'crypt', slots: range(23, 30) },
] as const satisfies readonly CampaignChapterDefinition[];

export function getCampaignChapter(id: CampaignChapterId): CampaignChapterDefinition {
  const chapter = campaignChapters.find((entry) => entry.id === id);
  if (chapter === undefined) throw new Error(`Unknown campaign chapter: ${id}`);
  return chapter;
}

export function getCampaignChapterForSlot(slot: number): CampaignChapterDefinition {
  const chapter = campaignChapters.find((entry) => entry.slots.includes(slot));
  if (chapter === undefined) throw new Error(`No campaign chapter owns slot ${slot}.`);
  return chapter;
}

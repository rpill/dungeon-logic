import { campaignChapters } from '../content/campaign/chapters';
import {
  DEV_BOARD_THEME,
  campaignThemes,
  getCampaignTheme,
  getCampaignThemeForChapter,
} from '../content/campaign/themes';
import { validateBoardVisualTheme } from '../view/BoardVisualTheme';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const themeIds = ['graveyard', 'desert-ruins', 'sewers', 'crypt'] as const;
for (const themeId of themeIds) {
  const theme = getCampaignTheme(themeId);
  assert(theme.id === themeId, `Theme ${themeId} resolves itself.`);
  validateBoardVisualTheme(theme);
}

for (const chapter of campaignChapters) {
  assert(
    getCampaignThemeForChapter(chapter.id).id === chapter.themeId,
    `Chapter ${chapter.id} resolves theme ${chapter.themeId}.`,
  );
}

assert(new Set(Object.keys(campaignThemes)).size === themeIds.length, 'Theme ids are unique.');
validateBoardVisualTheme(DEV_BOARD_THEME);

console.info('[Dungeon Logic] Campaign theme sanity: frame/theme checks passed');

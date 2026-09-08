import type { CampaignChapterId, CampaignThemeId } from './types';
import { getCampaignChapter } from './chapters';
import type { BoardVisualTheme, SpriteFrameRef } from '../../view/BoardVisualTheme';

const terrain = (frame: number): SpriteFrameRef => ({ textureKey: 'oryx-terrain', frame });
const hero = (frame: number): SpriteFrameRef => ({ textureKey: 'oryx-heroes-simple', frame });
const item = (frame: number): SpriteFrameRef => ({ textureKey: 'oryx-items', frame });
const custom = (textureKey: SpriteFrameRef['textureKey']): SpriteFrameRef => ({ textureKey, frame: 0 });


export const campaignThemes: Readonly<Record<CampaignThemeId, BoardVisualTheme>> = {
  graveyard: {
    id: 'graveyard',
    board: {
      floor: custom('graveyard-floor'),
      wallFrames: [custom('graveyard-wall-a')],
      clueTile: custom('graveyard-clue-tile'),
      clueCorner: custom('graveyard-clue-corner'),
      roomFloor: custom('graveyard-floor'),
      floorMark: custom('graveyard-floor-mark'),
    },
    // ORYX is deliberately retained only for entities during this SBS trial.
    entities: { monsterFrames: [hero(68), hero(61), hero(62)], chest: item(29) },
    decoration: { propFrames: [] },
  },
  'desert-ruins': {
    id: 'desert-ruins',
    board: {
      floor: terrain(165),
      wallFrames: [terrain(301)],
      clueTile: terrain(301),
      roomFloor: terrain(181),
    },
    entities: { monsterFrames: [hero(54), hero(55), hero(80), hero(81), hero(82)], chest: item(30) },
    decoration: { propFrames: [terrain(630), terrain(631), terrain(632)] },
  },
  sewers: {
    id: 'sewers',
    board: {
      floor: terrain(121),
      wallFrames: [terrain(421)],
      clueTile: terrain(421),
      roomFloor: terrain(105),
    },
    entities: { monsterFrames: [hero(117), hero(118), hero(119), hero(123), hero(124)], chest: item(33) },
    decoration: { propFrames: [terrain(627), terrain(654), terrain(667), terrain(668)] },
  },
  crypt: {
    id: 'crypt',
    board: {
      floor: terrain(205),
      wallFrames: [terrain(481)],
      clueTile: terrain(481),
      roomFloor: terrain(190),
    },
    entities: { monsterFrames: [hero(30), hero(31), hero(32), hero(44), hero(48)], chest: item(34) },
    decoration: { propFrames: [terrain(625), terrain(626), terrain(634), terrain(635), terrain(648)] },
  },
};

export const DEV_BOARD_THEME = campaignThemes.graveyard;

export function getCampaignTheme(themeId: CampaignThemeId): BoardVisualTheme {
  return campaignThemes[themeId];
}

export function getCampaignThemeForChapter(chapterId: CampaignChapterId): BoardVisualTheme {
  return getCampaignTheme(getCampaignChapter(chapterId).themeId);
}

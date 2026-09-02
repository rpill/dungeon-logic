import type {
  LevelDefinition,
} from '../../puzzle/types';

export const level011:
  LevelDefinition = {
  id: 'level-011',

  width: 8,
  height: 8,

  rowClues: [
    5,
    5,
    4,
    5,
    4,
    2,
    2,
    5,
  ],

  columnClues: [
    5,
    5,
    1,
    4,
    2,
    5,
    5,
    5,
  ],

  monsters: [],

  chests: [
    {
      x: 0,
      y: 7,
    },
    {
      x: 2,
      y: 0,
    },
  ],

  blockers: [],
  doors: [],

  solution: [
    '##...###',
    '##...###',
    '##....##',
    '#####...',
    '##...##.',
    '...#.#..',
    '...#...#',
    '...#####',
  ],
};

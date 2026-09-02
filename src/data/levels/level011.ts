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
    2,
    4,
    7,
    6,
    2,
    2,
    5,
  ],

  columnClues: [
    5,
    5,
    2,
    4,
    3,
    6,
    4,
    4,
  ],

  monsters: [],

  chests: [
    {
      x: 2,
      y: 1,
    },
    {
      x: 1,
      y: 5,
    },
  ],

  blockers: [],
  doors: [],

  solution: [
    '##...###',
    '##......',
    '##...##.',
    '#######.',
    '######..',
    '.....#.#',
    '...#...#',
    '...#####',
  ],
};

import type {
  LevelDefinition,
} from '../../puzzle/types';

export const level008:
  LevelDefinition = {
  id: 'level-008',

  width: 7,
  height: 7,

  rowClues: [
    7,
    4,
    1,
    1,
    2,
    4,
    7,
  ],

  columnClues: [
    4,
    2,
    3,
    5,
    4,
    4,
    4,
  ],

  monsters: [],

  chests: [
    {
      x: 4,
      y: 4,
    },
    {
      x: 0,
      y: 1,
    },
  ],

  blockers: [],
  doors: [],

  solution: [
    '#######',
    '...####',
    '...#...',
    '...#...',
    '#.#....',
    '#...###',
    '#######',
  ],
};

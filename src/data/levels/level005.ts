import type {
  LevelDefinition,
} from '../../puzzle/types';

export const level005:
  LevelDefinition = {
  id: 'level-005',

  width: 6,
  height: 6,

  rowClues: [
    2,
    3,
    5,
    3,
    3,
    0,
  ],

  columnClues: [
    2,
    2,
    2,
    4,
    2,
    4,
  ],

  monsters: [
    {
      x: 5,
      y: 0,
    },
    {
      x: 0,
      y: 1,
    },
    {
      x: 4,
      y: 3,
    },
    {
      x: 2,
      y: 4,
    },
    {
      x: 5,
      y: 5,
    },
  ],

  chests: [],

  blockers: [],
  doors: [],

  solution: [
    '##....',
    '...###',
    '#.####',
    '..##.#',
    '.#.#.#',
    '......',
  ],
};

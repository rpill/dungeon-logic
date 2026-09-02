import type {
  LevelDefinition,
} from '../../puzzle/types';

export const level009:
  LevelDefinition = {
  id: 'level-009',

  width: 7,
  height: 7,

  rowClues: [
    0,
    5,
    3,
    3,
    4,
    4,
    4,
  ],

  columnClues: [
    5,
    3,
    3,
    0,
    4,
    2,
    6,
  ],

  monsters: [
    {
      x: 6,
      y: 0,
    },
    {
      x: 0,
      y: 1,
    },
    {
      x: 5,
      y: 2,
    },
    {
      x: 1,
      y: 3,
    },
    {
      x: 2,
      y: 4,
    },
    {
      x: 1,
      y: 6,
    },
  ],

  chests: [],

  blockers: [],
  doors: [],

  solution: [
    '.......',
    '.##.###',
    '#...#.#',
    '#.#...#',
    '##..#.#',
    '###...#',
    '#...###',
  ],
};

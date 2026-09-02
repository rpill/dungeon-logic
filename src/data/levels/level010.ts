import type {
  LevelDefinition,
} from '../../puzzle/types';

export const level010:
  LevelDefinition = {
  id: 'level-010',

  width: 8,
  height: 8,

  rowClues: [
    5,
    7,
    6,
    6,
    4,
    2,
    4,
    5,
  ],

  columnClues: [
    8,
    8,
    5,
    5,
    5,
    4,
    1,
    3,
  ],

  monsters: [
    {
      x: 5,
      y: 0,
    },
    {
      x: 5,
      y: 3,
    },
    {
      x: 7,
      y: 5,
    },
    {
      x: 5,
      y: 7,
    },
    {
      x: 7,
      y: 7,
    },
  ],

  chests: [
    {
      x: 2,
      y: 4,
    },
  ],

  blockers: [],
  doors: [],

  solution: [
    '#####...',
    '#######.',
    '######..',
    '#####..#',
    '##...#.#',
    '##......',
    '##...#.#',
    '#####...',
  ],
};

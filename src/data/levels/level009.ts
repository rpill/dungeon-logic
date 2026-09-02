import type {
  LevelDefinition,
} from '../../puzzle/types';

export const level009:
  LevelDefinition = {
  id: 'level-009',

  width: 7,
  height: 7,

  rowClues: [
    7,
    6,
    4,
    5,
    5,
    3,
    2,
  ],

  columnClues: [
    7,
    6,
    5,
    5,
    3,
    3,
    3,
  ],

  monsters: [
    {
      x: 5,
      y: 1,
    },
    {
      x: 3,
      y: 2,
    },
    {
      x: 4,
      y: 4,
    },
    {
      x: 2,
      y: 5,
    },
    {
      x: 1,
      y: 6,
    },
    {
      x: 6,
      y: 6,
    },
  ],

  chests: [],

  blockers: [],
  doors: [],

  solution: [
    '#######',
    '#####.#',
    '###...#',
    '#####..',
    '####.#.',
    '##.#...',
    '#....#.',
  ],
};

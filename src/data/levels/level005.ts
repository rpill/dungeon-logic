import type {
  LevelDefinition,
} from '../../puzzle/types';

export const level005:
  LevelDefinition = {
  id: 'level-005',

  width: 6,
  height: 6,

  rowClues: [
    3,
    5,
    3,
    5,
    4,
    5,
  ],

  columnClues: [
    6,
    6,
    6,
    4,
    1,
    2,
  ],

  monsters: [
    {
      x: 3,
      y: 0,
    },
    {
      x: 5,
      y: 0,
    },
    {
      x: 3,
      y: 2,
    },
    {
      x: 4,
      y: 5,
    },
  ],

  chests: [],

  blockers: [],
  doors: [],

  solution: [
    '###...',
    '####.#',
    '###...',
    '#####.',
    '####..',
    '####.#',
  ],
};

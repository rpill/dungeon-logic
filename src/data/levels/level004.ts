import type {
  LevelDefinition,
} from '../../puzzle/types';

export const level004:
  LevelDefinition = {
  id: 'level-004',

  width: 6,
  height: 6,

  rowClues: [
    4,
    4,
    2,
    5,
    4,
    5,
  ],

  columnClues: [
    5,
    3,
    4,
    5,
    3,
    4,
  ],

  monsters: [
    {
      x: 0,
      y: 0,
    },
    {
      x: 5,
      y: 5,
    },
  ],

  chests: [],

  blockers: [
    {
      x: 2,
      y: 1,
    },
  ],

  doors: [
    {
      position: {
        x: 3,
        y: 2,
      },

      orientation: 'horizontal',
    },
  ],

  solution: [
    '..####',
    '#..###',
    '#....#',
    '####.#',
    '####..',
    '#####.',
  ],
};
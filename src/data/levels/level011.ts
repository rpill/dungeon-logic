import type {
  LevelDefinition,
} from '../../puzzle/types';

export const level011:
  LevelDefinition = {
  id: 'level-011',

  width: 8,
  height: 8,

  rowClues: [
    2,
    3,
    3,
    4,
    2,
    3,
    5,
    2,
  ],

  columnClues: [
    5,
    2,
    2,
    3,
    3,
    2,
    5,
    2,
  ],

  monsters: [],

  chests: [
    {
      x: 5,
      y: 5,
    },
    {
      x: 0,
      y: 2,
    },
  ],

  blockers: [],
  doors: [],

  solution: [
    '......##',
    '...##..#',
    '...###..',
    '###...#.',
    '#.....#.',
    '#.#...#.',
    '#..####.',
    '##......',
  ],
};

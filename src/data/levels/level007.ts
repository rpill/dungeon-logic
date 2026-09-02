import type {
  LevelDefinition,
} from '../../puzzle/types';

export const level007:
  LevelDefinition = {
  id: 'level-007',

  width: 7,
  height: 7,

  rowClues: [
    4,
    3,
    5,
    3,
    4,
    4,
    7,
  ],

  columnClues: [
    6,
    3,
    6,
    1,
    3,
    4,
    7,
  ],

  monsters: [
    {
      x: 0,
      y: 0,
    },
    {
      x: 3,
      y: 0,
    },
    {
      x: 4,
      y: 1,
    },
    {
      x: 1,
      y: 3,
    },
  ],

  chests: [
    {
      x: 4,
      y: 4,
    },
  ],

  blockers: [],
  doors: [],

  solution: [
    '..#.###',
    '#....##',
    '#.#.###',
    '#.#...#',
    '###...#',
    '###...#',
    '#######',
  ],
};

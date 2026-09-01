import type { LevelDefinition } from '../../puzzle/types';

export const level003: LevelDefinition = {
  id: 'level-003',

  width: 7,
  height: 7,

  rowClues: [
    5,
    2,
    6,
    4,
    4,
    4,
    7,
  ],

  columnClues: [
    6,
    5,
    6,
    6,
    3,
    2,
    4,
  ],

  monsters: [
    {
      x: 0,
      y: 0,
    },
  ],

  chests: [
    {
      x: 6,
      y: 5,
    },
  ],

  blockers: [],
  doors: [],

  solution: [
    '..#####',
    '#.....#',
    '#####.#',
    '####...',
    '####...',
    '####...',
    '#######',
  ],
};
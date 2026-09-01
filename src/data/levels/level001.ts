import type { LevelDefinition } from '../../puzzle/types';

export const level001: LevelDefinition = {
  id: 'level-001',

  width: 6,
  height: 6,

  rowClues: [
    3,
    1,
    2,
    5,
    5,
    4,
  ],

  columnClues: [
    5,
    1,
    5,
    3,
    3,
    3,
  ],

  monsters: [
    {
      x: 0,
      y: 5,
    },
  ],

  chests: [
    {
      x: 5,
      y: 0,
    },
  ],

  blockers: [],
  doors: [],

  solution: [
    '###...',
    '#.....',
    '#.#...',
    '#.####',
    '#.####',
    '..####',
  ],
};
import type { LevelDefinition } from '../../puzzle/types';

export const level002: LevelDefinition = {
  id: 'level-002',

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
    3,
    3,
    3,
    5,
    1,
    5,
  ],

  monsters: [
    {
      x: 5,
      y: 5,
    },
  ],

  chests: [
    {
      x: 0,
      y: 0,
    },
  ],

  blockers: [],
  doors: [],

  solution: [
    '...###',
    '.....#',
    '...#.#',
    '####.#',
    '####.#',
    '####..',
  ],
};
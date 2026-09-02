import type {
  LevelDefinition,
} from '../../puzzle/types';

export const level012:
  LevelDefinition = {
  id: 'level-012',

  width: 8,
  height: 8,

  rowClues: [
    3,
    0,
    4,
    5,
    5,
    5,
    8,
    8,
  ],

  columnClues: [
    5,
    5,
    5,
    7,
    4,
    3,
    3,
    6,
  ],

  monsters: [
    {
      x: 5,
      y: 0,
    },
    {
      x: 7,
      y: 0,
    },
  ],

  chests: [
    {
      x: 4,
      y: 3,
    },
    {
      x: 1,
      y: 1,
    },
  ],

  blockers: [],
  doors: [],

  solution: [
    '...##.#.',
    '........',
    '...###.#',
    '####...#',
    '####...#',
    '####...#',
    '########',
    '########',
  ],
};

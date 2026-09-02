import type {
  LevelDefinition,
} from '../../puzzle/types';

export const level012:
  LevelDefinition = {
  id: 'level-012',

  width: 8,
  height: 8,

  rowClues: [
    5,
    3,
    3,
    3,
    3,
    3,
    3,
    2,
  ],

  columnClues: [
    2,
    4,
    1,
    4,
    3,
    2,
    3,
    6,
  ],

  monsters: [
    {
      x: 6,
      y: 1,
    },
    {
      x: 7,
      y: 4,
    },
  ],

  chests: [
    {
      x: 3,
      y: 0,
    },
    {
      x: 6,
      y: 7,
    },
  ],

  blockers: [],
  doors: [],

  solution: [
    '#...####',
    '#...#..#',
    '....#.##',
    '.###....',
    '.#...##.',
    '.#.#...#',
    '.#.#...#',
    '...#...#',
  ],
};

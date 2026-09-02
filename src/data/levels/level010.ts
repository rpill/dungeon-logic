import type {
  LevelDefinition,
} from '../../puzzle/types';

export const level010:
  LevelDefinition = {
  id: 'level-010',

  width: 8,
  height: 8,

  rowClues: [
    5,
    2,
    2,
    2,
    5,
    4,
    5,
    6,
  ],

  columnClues: [
    4,
    4,
    5,
    4,
    3,
    4,
    2,
    5,
  ],

  monsters: [
    {
      x: 0,
      y: 4,
    },
    {
      x: 2,
      y: 5,
    },
    {
      x: 6,
      y: 5,
    },
    {
      x: 4,
      y: 7,
    },
    {
      x: 6,
      y: 7,
    },
  ],

  chests: [
    {
      x: 7,
      y: 1,
    },
  ],

  blockers: [],
  doors: [],

  solution: [
    '...#####',
    '.#..#...',
    '..#.#...',
    '#.#.....',
    '..##.###',
    '##...#.#',
    '####...#',
    '####.#.#',
  ],
};

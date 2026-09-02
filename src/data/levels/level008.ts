import type {
  LevelDefinition,
} from '../../puzzle/types';

export const level008:
  LevelDefinition = {
  id: 'level-008',

  width: 7,
  height: 7,

  rowClues: [
    4,
    3,
    4,
    3,
    1,
    1,
    4,
  ],

  columnClues: [
    4,
    2,
    3,
    5,
    1,
    1,
    4,
  ],

  monsters: [],

  chests: [
    {
      x: 0,
      y: 5,
    },
    {
      x: 6,
      y: 6,
    },
  ],

  blockers: [],
  doors: [],

  solution: [
    '###...#',
    '#...#.#',
    '#.##..#',
    '...#.##',
    '...#...',
    '...#...',
    '####...',
  ],
};

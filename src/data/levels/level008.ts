import type {
  LevelDefinition,
} from '../../puzzle/types';

export const level008:
  LevelDefinition = {
  id: 'level-008',

  width: 7,
  height: 7,

  rowClues: [
    3,
    4,
    3,
    3,
    1,
    4,
    4,
  ],

  columnClues: [
    2,
    3,
    3,
    5,
    1,
    4,
    4,
  ],

  monsters: [],

  chests: [
    {
      x: 2,
      y: 4,
    },
    {
      x: 6,
      y: 6,
    },
  ],

  blockers: [],
  doors: [],

  solution: [
    '....###',
    '.##..##',
    '...#.##',
    '...#.##',
    '...#...',
    '####...',
    '####...',
  ],
};

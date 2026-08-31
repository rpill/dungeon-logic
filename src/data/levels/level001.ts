import type { LevelDefinition } from '../../puzzle/types';

export const level001: LevelDefinition = {
  id: 'level-001',

  width: 6,
  height: 6,

  rowClues: [
    3,
    3,
    1,
    2,
    2,
    1,
  ],

  columnClues: [
    1,
    4,
    1,
    3,
    2,
    1,
  ],

  monsters: [
    {
      x: 2,
      y: 1,
    },
    {
      x: 5,
      y: 3,
    },
  ],

  solution: [
    '###...',
    '.#.##.',
    '.#....',
    '...##.',
    '.#...#',
    '...#..',
  ],
};
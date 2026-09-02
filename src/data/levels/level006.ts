import type {
  LevelDefinition,
} from '../../puzzle/types';

export const level006:
  LevelDefinition = {
  id: 'level-006',

  width: 6,
  height: 6,

  rowClues: [
    3,
    3,
    3,
    3,
    4,
    3,
  ],

  columnClues: [
    3,
    4,
    0,
    3,
    3,
    6,
  ],

  monsters: [],

  chests: [
    {
      x: 4,
      y: 0,
    },
  ],

  blockers: [],
  doors: [],

  solution: [
    '##...#',
    '##...#',
    '##...#',
    '...###',
    '.#.###',
    '...###',
  ],
};

import type {
  LevelDefinition,
} from '../../puzzle/types';

export const level012:
  LevelDefinition = {
  id: 'level-012',

  width: 8,
  height: 8,

  rowClues: [
    2,
    1,
    3,
    5,
    7,
    4,
    2,
    4,
  ],

  columnClues: [
    0,
    5,
    4,
    3,
    4,
    2,
    5,
    5,
  ],

  monsters: [
    {
      x: 0,
      y: 0,
    },
    {
      x: 0,
      y: 7,
    },
  ],

  chests: [
    {
      x: 5,
      y: 7,
    },
    {
      x: 7,
      y: 2,
    },
  ],

  blockers: [],
  doors: [],

  solution: [
    '.##.....',
    '....#...',
    '.#.##...',
    '...#####',
    '.#######',
    '.##...##',
    '......##',
    '.##...##',
  ],
};

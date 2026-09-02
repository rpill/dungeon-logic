import type {
  LevelDefinition,
} from '../../puzzle/types';

export const level007:
  LevelDefinition = {
  id: 'level-007',

  width: 7,
  height: 7,

  rowClues: [
    2,
    4,
    1,
    4,
    3,
    2,
    3,
  ],

  columnClues: [
    5,
    5,
    2,
    1,
    2,
    3,
    1,
  ],

  monsters: [
    {
      x: 1,
      y: 0,
    },
    {
      x: 4,
      y: 0,
    },
    {
      x: 6,
      y: 0,
    },
    {
      x: 0,
      y: 3,
    },
    {
      x: 6,
      y: 6,
    },
  ],

  chests: [
    {
      x: 2,
      y: 4,
    },
  ],

  blockers: [],
  doors: [],

  solution: [
    '#....#.',
    '###.#..',
    '......#',
    '.####..',
    '##...#.',
    '##.....',
    '##...#.',
  ],
};

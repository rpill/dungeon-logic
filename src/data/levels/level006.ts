import type {
  LevelDefinition,
} from '../../puzzle/types';

export const level006:
  LevelDefinition = {
  id: 'level-006',

  width: 7,
  height: 7,

  rowClues: [
    1,
    3,
    3,
    3,
    3,
    4,
    2,
  ],

  columnClues: [
    4,
    1,
    2,
    3,
    4,
    1,
    4,
  ],

  monsters: [],

  chests: [
    {
      x: 0,
      y: 2,
    },
  ],

  blockers: [],
  doors: [],

  solution: [
    '......#',
    '...##.#',
    '...##.#',
    '###....',
    '#...##.',
    '#.###..',
    '#.....#',
  ],
};

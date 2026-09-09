import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  id: 'tutorial-004',
  width: 6,
  height: 6,
  rowClues: [3, 1, 2, 2, 3, 0],
  columnClues: [0, 2, 2, 3, 3, 1],
  monsters: [{ x: 4, y: 1 }],
  chests: [{ x: 1, y: 1 }],
  blockers: [],
  doors: [],
  solution: [
    '...###',
    '...#..',
    '...##.',
    '.##...',
    '.##.#.',
    '......',
  ],
};

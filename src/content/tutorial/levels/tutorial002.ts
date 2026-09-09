import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  id: 'tutorial-002',
  width: 5,
  height: 5,
  rowClues: [1, 4, 2, 4, 1],
  columnClues: [4, 1, 2, 1, 4],
  monsters: [
    { x: 0, y: 0 },
    { x: 4, y: 4 },
  ],
  chests: [],
  blockers: [],
  doors: [],
  solution: [
    '....#',
    '###.#',
    '#...#',
    '#.###',
    '#....',
  ],
};

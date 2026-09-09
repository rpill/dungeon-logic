import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  id: 'tutorial-002',
  width: 5,
  height: 5,
  rowClues: [3, 1, 3, 1, 5],
  columnClues: [4, 1, 3, 3, 2],
  monsters: [{ x: 0, y: 0 }],
  chests: [],
  blockers: [],
  doors: [],
  solution: [
    '..###',
    '#....',
    '#.##.',
    '#....',
    '#####',
  ],
};

import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  id: 'tutorial-004',
  width: 5,
  height: 4,
  rowClues: [3, 1, 1, 1],
  columnClues: [0, 3, 1, 2, 0],
  monsters: [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 0, y: 3 },
  ],
  chests: [],
  blockers: [],
  doors: [],
  solution: [
    '.###.',
    '.#...',
    '...#.',
    '.#...',
  ],
};

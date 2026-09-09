import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  id: 'tutorial-001',
  width: 3,
  height: 3,
  rowClues: [0, 1, 0],
  columnClues: [0, 1, 0],
  monsters: [],
  chests: [],
  blockers: [],
  doors: [],
  solution: [
    '...',
    '.#.',
    '...',
  ],
};

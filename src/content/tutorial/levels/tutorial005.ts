import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  id: 'tutorial-005',
  width: 5,
  height: 5,
  rowClues: [2, 2, 2, 2, 4],
  columnClues: [2, 2, 1, 4, 3],
  monsters: [{ x: 4, y: 4 }],
  chests: [{ x: 0, y: 0 }],
  blockers: [],
  doors: [],
  solution: [
    '...##',
    '...##',
    '...##',
    '##...',
    '####.',
  ],
};

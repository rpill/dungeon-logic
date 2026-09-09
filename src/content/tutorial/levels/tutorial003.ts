import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  id: 'tutorial-003',
  width: 5,
  height: 4,
  rowClues: [4, 2, 2, 2],
  columnClues: [1, 3, 1, 3, 2],
  monsters: [
    { x: 0, y: 0 },
    { x: 0, y: 2 },
    { x: 4, y: 2 },
  ],
  chests: [],
  blockers: [],
  doors: [],
  solution: [
    '.####',
    '...##',
    '.#.#.',
    '##...',
  ],
};

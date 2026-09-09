import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  id: 'tutorial-003',
  width: 5,
  height: 5,
  rowClues: [1, 2, 1, 2, 0],
  columnClues: [0, 2, 1, 2, 1],
  monsters: [],
  chests: [],
  blockers: [],
  doors: [],
  solution: [
    '....#',
    '.##..',
    '...#.',
    '.#.#.',
    '.....',
  ],
};

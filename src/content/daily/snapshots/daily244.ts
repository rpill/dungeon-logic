import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-244",
  "width": 7,
  "height": 7,
  "rowClues": [
    6,
    4,
    2,
    3,
    0,
    4,
    1
  ],
  "columnClues": [
    3,
    4,
    1,
    5,
    1,
    3,
    3
  ],
  "monsters": [
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 2,
      "y": 1
    },
    {
      "x": 6,
      "y": 1
    },
    {
      "x": 1,
      "y": 2
    },
    {
      "x": 0,
      "y": 3
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "####.##",
    "##.#.#.",
    "#..#...",
    ".#.#.#.",
    ".......",
    ".#.##.#",
    "......#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1707005304,
  "sourceCandidateId": "generated-monster-only-7-1707005304",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 48
};

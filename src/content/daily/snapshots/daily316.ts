import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-316",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    4,
    2,
    4,
    2,
    2,
    2
  ],
  "columnClues": [
    2,
    3,
    5,
    0,
    4,
    3,
    4
  ],
  "monsters": [
    {
      "x": 1,
      "y": 0
    },
    {
      "x": 3,
      "y": 0
    },
    {
      "x": 4,
      "y": 1
    },
    {
      "x": 5,
      "y": 2
    },
    {
      "x": 0,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "#.#.###",
    "#.#..##",
    "....#.#",
    ".##.#.#",
    ".##....",
    "....##.",
    ".##...."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2886131376,
  "sourceCandidateId": "generated-monster-only-7-2886131376",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 36
};

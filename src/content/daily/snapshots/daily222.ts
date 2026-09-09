import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-222",
  "width": 7,
  "height": 7,
  "rowClues": [
    0,
    3,
    0,
    4,
    2,
    5,
    6
  ],
  "columnClues": [
    4,
    2,
    4,
    3,
    3,
    4,
    0
  ],
  "monsters": [
    {
      "x": 1,
      "y": 5
    },
    {
      "x": 6,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    ".......",
    ".#.#.#.",
    ".......",
    "#.#.##.",
    "#.#....",
    "#.####.",
    "######."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3194106138,
  "sourceCandidateId": "generated-monster-only-7-3194106138",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 36
};

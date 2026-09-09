import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-208",
  "width": 7,
  "height": 7,
  "rowClues": [
    0,
    4,
    2,
    2,
    2,
    4,
    6
  ],
  "columnClues": [
    3,
    2,
    5,
    3,
    2,
    4,
    1
  ],
  "monsters": [
    {
      "x": 4,
      "y": 5
    },
    {
      "x": 6,
      "y": 5
    },
    {
      "x": 1,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    ".......",
    ".###.#.",
    ".##....",
    "....##.",
    "#.#....",
    "#.##.#.",
    "#.#####"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3818236820,
  "sourceCandidateId": "generated-monster-only-7-3818236820",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 59,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 60
};

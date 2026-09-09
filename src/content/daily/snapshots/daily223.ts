import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-223",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    4,
    4,
    0,
    4,
    1,
    3
  ],
  "columnClues": [
    3,
    1,
    4,
    2,
    4,
    5,
    2
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 0,
      "y": 3
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
    "..#####",
    "#...###",
    "#.#.##.",
    ".......",
    "#.#.##.",
    ".....#.",
    ".###..."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 554614747,
  "sourceCandidateId": "generated-monster-only-7-554614747",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 43,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 42
};

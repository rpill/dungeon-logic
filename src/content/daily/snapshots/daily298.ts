import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-298",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    2,
    4,
    1,
    2,
    5,
    3
  ],
  "columnClues": [
    5,
    5,
    4,
    4,
    0,
    3,
    0
  ],
  "monsters": [
    {
      "x": 1,
      "y": 1
    },
    {
      "x": 0,
      "y": 4
    },
    {
      "x": 2,
      "y": 4
    },
    {
      "x": 3,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "####...",
    "#....#.",
    "####...",
    ".....#.",
    ".#.#...",
    "####.#.",
    "###...."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3168514185,
  "sourceCandidateId": "generated-monster-only-7-3168514185",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 42
};

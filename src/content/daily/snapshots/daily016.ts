import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-016",
  "width": 7,
  "height": 7,
  "rowClues": [
    6,
    3,
    2,
    2,
    3,
    3,
    1
  ],
  "columnClues": [
    5,
    1,
    4,
    4,
    1,
    4,
    1
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
      "x": 0,
      "y": 2
    },
    {
      "x": 0,
      "y": 6
    },
    {
      "x": 5,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "####.##",
    "#..#.#.",
    "..##...",
    "#....#.",
    "#.##...",
    "#.#..#.",
    "....#.."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2098303882,
  "sourceCandidateId": "generated-monster-only-7-2098303882",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 31,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 34
};

import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-337",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    1,
    4,
    0,
    4,
    2,
    6
  ],
  "columnClues": [
    5,
    2,
    4,
    2,
    3,
    4,
    0
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 3,
      "y": 0
    },
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 0,
      "y": 3
    },
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
    "..#.##.",
    "#......",
    "##.#.#.",
    ".......",
    "#.#.##.",
    "#.#....",
    "######."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2247996074,
  "sourceCandidateId": "generated-monster-only-7-2247996074",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 31,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 31
};

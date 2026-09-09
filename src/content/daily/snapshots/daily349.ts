import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-349",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    2,
    4,
    0,
    5,
    2,
    5
  ],
  "columnClues": [
    6,
    4,
    4,
    0,
    4,
    2,
    3
  ],
  "monsters": [
    {
      "x": 3,
      "y": 0
    },
    {
      "x": 5,
      "y": 0
    },
    {
      "x": 0,
      "y": 3
    },
    {
      "x": 2,
      "y": 5
    },
    {
      "x": 3,
      "y": 6
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
    "###.#.#",
    "#.....#",
    "#.#.#.#",
    ".......",
    "###.##.",
    "##.....",
    "###.##."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2921771503,
  "sourceCandidateId": "generated-monster-only-7-2921771503",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 31,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 31
};

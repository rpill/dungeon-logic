import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-340",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    6,
    2,
    4,
    0,
    4,
    4
  ],
  "columnClues": [
    1,
    2,
    2,
    4,
    4,
    5,
    6
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 2,
      "y": 0
    },
    {
      "x": 6,
      "y": 4
    },
    {
      "x": 3,
      "y": 5
    },
    {
      "x": 5,
      "y": 5
    },
    {
      "x": 2,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "...####",
    "#.#####",
    ".....##",
    ".#.#.##",
    ".......",
    ".##.#.#",
    "...####"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 314268297,
  "sourceCandidateId": "generated-monster-only-7-314268297",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 31,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 31
};

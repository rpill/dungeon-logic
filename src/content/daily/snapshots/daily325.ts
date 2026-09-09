import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-325",
  "width": 7,
  "height": 7,
  "rowClues": [
    6,
    6,
    1,
    3,
    0,
    5,
    1
  ],
  "columnClues": [
    3,
    4,
    3,
    3,
    1,
    4,
    4
  ],
  "monsters": [
    {
      "x": 4,
      "y": 0
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
    "####.##",
    ".#.....",
    ".#.#.#.",
    ".......",
    "#.#.###",
    "......#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2325003222,
  "sourceCandidateId": "generated-monster-only-7-2325003222",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 34
};

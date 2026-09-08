import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-046",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    5,
    1,
    3,
    4,
    2,
    4
  ],
  "columnClues": [
    4,
    3,
    4,
    1,
    3,
    1,
    5
  ],
  "monsters": [
    {
      "x": 5,
      "y": 0
    },
    {
      "x": 6,
      "y": 3
    },
    {
      "x": 0,
      "y": 4
    },
    {
      "x": 1,
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
    "#.....#",
    "#.##.##",
    "......#",
    ".##.#..",
    ".##.#.#",
    "#.....#",
    "###.#.."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1941578599,
  "sourceCandidateId": "generated-monster-only-7-1941578599",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 33
};

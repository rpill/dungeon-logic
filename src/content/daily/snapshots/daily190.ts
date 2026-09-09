import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-190",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    4,
    0,
    4,
    2,
    2,
    4
  ],
  "columnClues": [
    5,
    1,
    5,
    3,
    2,
    2,
    2
  ],
  "monsters": [
    {
      "x": 1,
      "y": 1
    },
    {
      "x": 0,
      "y": 2
    },
    {
      "x": 0,
      "y": 5
    },
    {
      "x": 1,
      "y": 6
    },
    {
      "x": 3,
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
    "####...",
    "#.##.#.",
    ".......",
    "#.##.#.",
    "#.#....",
    "....#.#",
    "#.#.#.#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 4151083337,
  "sourceCandidateId": "generated-monster-only-7-4151083337",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 59,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 60
};

import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-025",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    2,
    4,
    0,
    3,
    4,
    4
  ],
  "columnClues": [
    3,
    4,
    2,
    4,
    3,
    2,
    4
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 5,
      "y": 0
    },
    {
      "x": 0,
      "y": 4
    },
    {
      "x": 6,
      "y": 5
    },
    {
      "x": 2,
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
    ".####.#",
    "....#.#",
    "#.#.#.#",
    ".......",
    ".#.#.#.",
    "##.#.#.",
    "##.#..#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 978987067,
  "sourceCandidateId": "generated-monster-only-7-978987067",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 56,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 52
};

import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-148",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    3,
    4,
    0,
    5,
    4,
    1
  ],
  "columnClues": [
    5,
    5,
    2,
    2,
    3,
    3,
    1
  ],
  "monsters": [
    {
      "x": 2,
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
      "x": 0,
      "y": 6
    },
    {
      "x": 4,
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
    "##.##..",
    "##...#.",
    "##.#.#.",
    ".......",
    "###.#.#",
    "###.#..",
    ".....#."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 828314764,
  "sourceCandidateId": "generated-monster-only-7-828314764",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 48
};

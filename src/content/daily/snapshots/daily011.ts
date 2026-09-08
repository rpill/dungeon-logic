import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-011",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    4,
    5,
    1,
    4,
    0,
    4
  ],
  "columnClues": [
    5,
    5,
    3,
    2,
    2,
    2,
    2
  ],
  "monsters": [
    {
      "x": 2,
      "y": 0
    },
    {
      "x": 6,
      "y": 1
    },
    {
      "x": 1,
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
    "##....#",
    "###.#..",
    "###.#.#",
    "#......",
    "##.#.#.",
    ".......",
    ".###.#."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3259934192,
  "sourceCandidateId": "generated-monster-only-7-3259934192",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 56,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 56
};

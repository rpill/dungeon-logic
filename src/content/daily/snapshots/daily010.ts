import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-010",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    2,
    4,
    1,
    2,
    2,
    5
  ],
  "columnClues": [
    2,
    5,
    1,
    3,
    4,
    2,
    3
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
      "x": 5,
      "y": 0
    },
    {
      "x": 3,
      "y": 1
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
    ".#.##.#",
    "....#.#",
    ".#.##.#",
    ".#.....",
    "...#.#.",
    "##.....",
    "###.##."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2324599163,
  "sourceCandidateId": "generated-monster-only-7-2324599163",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 50
};

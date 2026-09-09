import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-351",
  "width": 7,
  "height": 7,
  "rowClues": [
    1,
    3,
    1,
    5,
    4,
    3,
    3
  ],
  "columnClues": [
    4,
    5,
    0,
    4,
    1,
    3,
    3
  ],
  "monsters": [
    {
      "x": 6,
      "y": 1
    },
    {
      "x": 6,
      "y": 4
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
    "......#",
    ".#.##..",
    "......#",
    "##.#.##",
    "##.#.#.",
    "##.#...",
    "##...#."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 4228196401,
  "sourceCandidateId": "generated-monster-only-7-4228196401",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 31,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 31
};

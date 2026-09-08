import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-050",
  "width": 7,
  "height": 7,
  "rowClues": [
    6,
    4,
    4,
    2,
    1,
    3,
    0
  ],
  "columnClues": [
    3,
    5,
    1,
    4,
    0,
    4,
    3
  ],
  "monsters": [
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 2,
      "y": 1
    },
    {
      "x": 5,
      "y": 1
    },
    {
      "x": 0,
      "y": 3
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "####.##",
    "##.#..#",
    "##...##",
    ".#.#...",
    ".....#.",
    ".#.#.#.",
    "......."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 424792351,
  "sourceCandidateId": "generated-monster-only-7-424792351",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 43,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 39
};

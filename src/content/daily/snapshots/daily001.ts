import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-001",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    2,
    3,
    1,
    4,
    3,
    6
  ],
  "columnClues": [
    1,
    4,
    2,
    3,
    3,
    3,
    5
  ],
  "monsters": [
    {
      "x": 1,
      "y": 0
    },
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 0,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "#.#....",
    "....#.#",
    ".#.##..",
    "......#",
    ".#.#.##",
    ".#...##",
    ".######"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 580725752,
  "sourceCandidateId": "generated-monster-only-7-580725752",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 32
};

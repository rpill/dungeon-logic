import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-352",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    5,
    1,
    4,
    5,
    0,
    4
  ],
  "columnClues": [
    2,
    3,
    1,
    3,
    2,
    4,
    6
  ],
  "monsters": [
    {
      "x": 5,
      "y": 0
    },
    {
      "x": 5,
      "y": 2
    },
    {
      "x": 4,
      "y": 3
    },
    {
      "x": 6,
      "y": 5
    },
    {
      "x": 0,
      "y": 6
    },
    {
      "x": 2,
      "y": 6
    },
    {
      "x": 4,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "#.....#",
    "#.#.###",
    "......#",
    ".#.#.##",
    ".#.####",
    ".......",
    ".#.#.##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2457955021,
  "sourceCandidateId": "generated-monster-only-7-2457955021",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 31,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 31
};

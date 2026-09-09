import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-136",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    4,
    2,
    5,
    0,
    4,
    3
  ],
  "columnClues": [
    3,
    1,
    4,
    2,
    1,
    3,
    6
  ],
  "monsters": [
    {
      "x": 5,
      "y": 0
    },
    {
      "x": 0,
      "y": 1
    },
    {
      "x": 5,
      "y": 2
    },
    {
      "x": 6,
      "y": 4
    },
    {
      "x": 5,
      "y": 5
    },
    {
      "x": 1,
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
    "..##.##",
    "#.....#",
    "#.##.##",
    ".......",
    ".##.#.#",
    "..#..##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 109894201,
  "sourceCandidateId": "generated-monster-only-7-109894201",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 34
};

import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-129",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    4,
    3,
    0,
    4,
    3,
    4
  ],
  "columnClues": [
    3,
    2,
    3,
    3,
    2,
    4,
    5
  ],
  "monsters": [
    {
      "x": 1,
      "y": 0
    },
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 2,
      "y": 1
    },
    {
      "x": 6,
      "y": 2
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
    "..##.##",
    ".#.#.##",
    ".#.#.#.",
    ".......",
    "#.#.#.#",
    "#...#.#",
    "#.#..##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 479170942,
  "sourceCandidateId": "generated-monster-only-7-479170942",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 43,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 42
};

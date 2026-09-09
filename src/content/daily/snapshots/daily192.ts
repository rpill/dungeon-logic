import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-192",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    1,
    3,
    2,
    4,
    5,
    3
  ],
  "columnClues": [
    4,
    2,
    4,
    3,
    4,
    3,
    2
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
      "x": 4,
      "y": 0
    },
    {
      "x": 0,
      "y": 3
    },
    {
      "x": 5,
      "y": 4
    },
    {
      "x": 1,
      "y": 5
    },
    {
      "x": 3,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    ".#.#.##",
    "......#",
    "#.#.#..",
    "....##.",
    "#.###..",
    "#.####.",
    "###...."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3989349868,
  "sourceCandidateId": "generated-monster-only-7-3989349868",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 67,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 66
};

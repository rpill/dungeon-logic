import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-114",
  "width": 7,
  "height": 7,
  "rowClues": [
    1,
    5,
    2,
    4,
    3,
    1,
    4
  ],
  "columnClues": [
    1,
    3,
    5,
    4,
    4,
    2,
    1
  ],
  "monsters": [
    {
      "x": 2,
      "y": 0
    },
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 1,
      "y": 2
    },
    {
      "x": 4,
      "y": 2
    },
    {
      "x": 3,
      "y": 3
    },
    {
      "x": 1,
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
    "...#...",
    ".#####.",
    "..##...",
    ".##.##.",
    ".##.#..",
    "......#",
    "#.###.."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2256329403,
  "sourceCandidateId": "generated-monster-only-7-2256329403",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 60,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 60
};

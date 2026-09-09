import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-276",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    3,
    2,
    1,
    3,
    4,
    4
  ],
  "columnClues": [
    0,
    4,
    0,
    4,
    3,
    6,
    5
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
      "y": 1
    },
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 0,
      "y": 6
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
    ".#.####",
    "...#.##",
    ".#...#.",
    "...#...",
    ".#...##",
    "...####",
    ".#..###"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3023570050,
  "sourceCandidateId": "generated-monster-only-7-3023570050",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 59,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 58
};

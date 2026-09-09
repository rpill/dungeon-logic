import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-082",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    2,
    2,
    3,
    3,
    4,
    3
  ],
  "columnClues": [
    0,
    4,
    1,
    4,
    2,
    4,
    6
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 6,
      "y": 1
    },
    {
      "x": 0,
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
    ".###..#",
    "...##..",
    ".#....#",
    "...#.##",
    ".#...##",
    "...####",
    ".#...##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2173982623,
  "sourceCandidateId": "generated-monster-only-7-2173982623",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 45,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 46
};

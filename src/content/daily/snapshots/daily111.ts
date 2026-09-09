import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-111",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    3,
    1,
    3,
    2,
    4,
    5
  ],
  "columnClues": [
    2,
    4,
    4,
    3,
    0,
    4,
    3
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
      "x": 6,
      "y": 0
    },
    {
      "x": 1,
      "y": 5
    },
    {
      "x": 5,
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
    ".#...#.",
    ".###...",
    ".....#.",
    ".###...",
    ".....##",
    "#.##..#",
    "###..##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1690374780,
  "sourceCandidateId": "generated-monster-only-7-1690374780",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 48
};

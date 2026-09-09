import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-268",
  "width": 7,
  "height": 7,
  "rowClues": [
    1,
    3,
    2,
    3,
    3,
    4,
    4
  ],
  "columnClues": [
    6,
    3,
    4,
    3,
    0,
    4,
    0
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 1,
      "y": 3
    },
    {
      "x": 2,
      "y": 4
    },
    {
      "x": 3,
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
    ".....#.",
    "#.##...",
    "#....#.",
    "#.##...",
    "##...#.",
    "####...",
    "###..#."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 4122732177,
  "sourceCandidateId": "generated-monster-only-7-4122732177",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 34
};

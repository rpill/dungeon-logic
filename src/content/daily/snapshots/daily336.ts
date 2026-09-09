import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-336",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    6,
    4,
    4,
    2,
    3,
    3
  ],
  "columnClues": [
    5,
    5,
    4,
    4,
    0,
    4,
    4
  ],
  "monsters": [
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 2,
      "y": 2
    },
    {
      "x": 0,
      "y": 3
    },
    {
      "x": 5,
      "y": 3
    },
    {
      "x": 1,
      "y": 5
    },
    {
      "x": 2,
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
    "####...",
    "####.##",
    "##...##",
    ".###..#",
    ".....##",
    "#.##...",
    "##...#."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2307103545,
  "sourceCandidateId": "generated-monster-only-7-2307103545",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 31,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 36
};

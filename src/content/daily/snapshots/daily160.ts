import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-160",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    6,
    3,
    1,
    4,
    3,
    4
  ],
  "columnClues": [
    6,
    5,
    4,
    2,
    1,
    5,
    3
  ],
  "monsters": [
    {
      "x": 3,
      "y": 0
    },
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 0,
      "y": 3
    },
    {
      "x": 1,
      "y": 5
    },
    {
      "x": 6,
      "y": 5
    },
    {
      "x": 5,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "###..##",
    "####.##",
    "##...#.",
    "...#...",
    "###..#.",
    "#...##.",
    "###...#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2857805237,
  "sourceCandidateId": "generated-monster-only-7-2857805237",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 57,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 52
};

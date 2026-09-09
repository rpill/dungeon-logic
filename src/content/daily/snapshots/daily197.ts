import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-197",
  "width": 7,
  "height": 7,
  "rowClues": [
    1,
    4,
    2,
    1,
    2,
    4,
    6
  ],
  "columnClues": [
    0,
    4,
    3,
    3,
    3,
    5,
    2
  ],
  "monsters": [
    {
      "x": 1,
      "y": 5
    },
    {
      "x": 6,
      "y": 5
    },
    {
      "x": 0,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 4,
      "y": 3
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "......#",
    ".####..",
    ".#...#.",
    ".....#.",
    ".#...#.",
    "..####.",
    ".######"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2829250003,
  "sourceCandidateId": "generated-mixed-one-room-7-2829250003",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 57,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 54
};

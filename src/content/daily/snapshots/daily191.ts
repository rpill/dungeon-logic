import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-191",
  "width": 7,
  "height": 7,
  "rowClues": [
    6,
    5,
    3,
    1,
    2,
    4,
    1
  ],
  "columnClues": [
    0,
    4,
    3,
    3,
    3,
    5,
    4
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 1,
      "y": 1
    },
    {
      "x": 6,
      "y": 3
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
    ".######",
    "..#####",
    ".#...##",
    ".....#.",
    ".#...#.",
    ".####..",
    "......#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 4015410359,
  "sourceCandidateId": "generated-mixed-one-room-7-4015410359",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 42
};

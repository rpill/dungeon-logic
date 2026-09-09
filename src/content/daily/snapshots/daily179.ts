import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-179",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    4,
    2,
    2,
    1,
    5,
    3
  ],
  "columnClues": [
    4,
    4,
    1,
    3,
    3,
    3,
    3
  ],
  "monsters": [
    {
      "x": 0,
      "y": 1
    },
    {
      "x": 3,
      "y": 1
    },
    {
      "x": 1,
      "y": 2
    },
    {
      "x": 0,
      "y": 4
    },
    {
      "x": 6,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 6,
      "y": 4
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "...####",
    ".#..###",
    "#..#...",
    "##.....",
    "...#...",
    "##..###",
    "###...."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1524939512,
  "sourceCandidateId": "generated-mixed-one-room-7-1524939512",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 56,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 52
};

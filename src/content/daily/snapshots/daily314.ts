import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-314",
  "width": 7,
  "height": 7,
  "rowClues": [
    6,
    5,
    2,
    1,
    2,
    4,
    1
  ],
  "columnClues": [
    3,
    5,
    3,
    3,
    3,
    4,
    0
  ],
  "monsters": [
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 5,
      "y": 1
    },
    {
      "x": 0,
      "y": 2
    }
  ],
  "chests": [
    {
      "x": 3,
      "y": 2
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "######.",
    "#####..",
    ".#...#.",
    ".#.....",
    ".#...#.",
    "..####.",
    "#......"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 253159368,
  "sourceCandidateId": "generated-mixed-one-room-7-253159368",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 34
};

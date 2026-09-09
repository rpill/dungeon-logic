import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-119",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    1,
    5,
    5,
    3,
    1,
    2
  ],
  "columnClues": [
    3,
    1,
    3,
    5,
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
      "x": 6,
      "y": 1
    },
    {
      "x": 0,
      "y": 3
    },
    {
      "x": 0,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 5,
      "y": 6
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "...####",
    ".#.....",
    "#..####",
    "..#####",
    "#.##...",
    "#......",
    "..##..."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3487639482,
  "sourceCandidateId": "generated-mixed-one-room-7-3487639482",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 42,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 42
};

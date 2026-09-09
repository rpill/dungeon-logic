import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-164",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    1,
    4,
    3,
    2,
    3,
    5
  ],
  "columnClues": [
    5,
    6,
    3,
    3,
    3,
    2,
    1
  ],
  "monsters": [
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 0,
      "y": 2
    },
    {
      "x": 5,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 2,
      "y": 5
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#####..",
    "......#",
    ".####..",
    "##...#.",
    "##.....",
    "##...#.",
    "#####.."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3665862628,
  "sourceCandidateId": "generated-mixed-one-room-7-3665862628",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 60,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 60
};

import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-161",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    0,
    3,
    4,
    4,
    4,
    4
  ],
  "columnClues": [
    2,
    2,
    4,
    3,
    2,
    4,
    4
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
      "x": 1,
      "y": 6
    },
    {
      "x": 4,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 6,
      "y": 0
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    ".#.#...",
    ".......",
    "#.##...",
    "#...###",
    "..#.###",
    ".##..##",
    "..##.##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 4196653266,
  "sourceCandidateId": "generated-mixed-one-room-7-4196653266",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 56,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 54
};

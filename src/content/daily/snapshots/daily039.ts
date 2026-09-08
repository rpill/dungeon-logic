import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-039",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    1,
    4,
    3,
    1,
    3,
    5
  ],
  "columnClues": [
    5,
    2,
    3,
    2,
    5,
    1,
    2
  ],
  "monsters": [
    {
      "x": 1,
      "y": 0
    },
    {
      "x": 3,
      "y": 0
    },
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 0,
      "y": 2
    },
    {
      "x": 6,
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
      "y": 3
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#.#.#..",
    "......#",
    ".####..",
    "#...#.#",
    "#......",
    "#...##.",
    "#####.."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 4193463377,
  "sourceCandidateId": "generated-mixed-one-room-7-4193463377",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 56,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 50
};

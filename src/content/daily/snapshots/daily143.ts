import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-143",
  "width": 7,
  "height": 7,
  "rowClues": [
    1,
    4,
    3,
    1,
    3,
    6,
    4
  ],
  "columnClues": [
    5,
    3,
    3,
    3,
    4,
    2,
    2
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
      "x": 4,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 1,
      "y": 4
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "......#",
    ".####..",
    "#...#.#",
    "#......",
    "#...##.",
    "######.",
    "####..."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1650081033,
  "sourceCandidateId": "generated-mixed-one-room-7-1650081033",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 56,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 52
};

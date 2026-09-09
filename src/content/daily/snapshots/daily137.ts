import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-137",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    4,
    3,
    0,
    3,
    4,
    6
  ],
  "columnClues": [
    5,
    3,
    1,
    4,
    4,
    4,
    4
  ],
  "monsters": [
    {
      "x": 3,
      "y": 0
    },
    {
      "x": 0,
      "y": 1
    },
    {
      "x": 0,
      "y": 3
    },
    {
      "x": 3,
      "y": 5
    },
    {
      "x": 2,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 5,
      "y": 2
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "##..###",
    "...####",
    "##.#...",
    ".......",
    "#.##...",
    "#...###",
    "##.####"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2165263481,
  "sourceCandidateId": "generated-mixed-one-room-7-2165263481",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 43,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 40
};

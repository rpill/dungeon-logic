import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-080",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    4,
    2,
    0,
    3,
    4,
    3
  ],
  "columnClues": [
    2,
    2,
    2,
    3,
    3,
    4,
    4
  ],
  "monsters": [
    {
      "x": 3,
      "y": 1
    },
    {
      "x": 0,
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
      "y": 2
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "...####",
    ".#..###",
    ".#.#...",
    ".......",
    "#.##...",
    "#...###",
    "..#..##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3019507307,
  "sourceCandidateId": "generated-mixed-one-room-7-3019507307",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 33,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 36
};

import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-299",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    4,
    3,
    3,
    3,
    2,
    2
  ],
  "columnClues": [
    2,
    0,
    2,
    3,
    4,
    5,
    5
  ],
  "monsters": [
    {
      "x": 4,
      "y": 2
    },
    {
      "x": 5,
      "y": 3
    },
    {
      "x": 0,
      "y": 4
    },
    {
      "x": 0,
      "y": 6
    },
    {
      "x": 6,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 2,
      "y": 1
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "...####",
    "...####",
    "...#.##",
    "#.#...#",
    "....###",
    "#.#....",
    "....##."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1431826068,
  "sourceCandidateId": "generated-mixed-one-room-7-1431826068",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 32
};

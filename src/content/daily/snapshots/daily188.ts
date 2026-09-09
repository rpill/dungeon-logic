import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-188",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    0,
    4,
    3,
    3,
    3,
    4
  ],
  "columnClues": [
    3,
    0,
    3,
    4,
    4,
    2,
    5
  ],
  "monsters": [
    {
      "x": 1,
      "y": 0
    },
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 0,
      "y": 1
    },
    {
      "x": 5,
      "y": 5
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
    "#.##.#.",
    ".......",
    "#.#.#.#",
    "#.#...#",
    "...##.#",
    "...##.#",
    "...####"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2287143702,
  "sourceCandidateId": "generated-mixed-one-room-7-2287143702",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 36
};

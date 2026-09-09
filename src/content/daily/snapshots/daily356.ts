import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-356",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    1,
    4,
    2,
    2,
    3,
    5
  ],
  "columnClues": [
    3,
    1,
    3,
    5,
    4,
    2,
    2
  ],
  "monsters": [
    {
      "x": 0,
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
      "x": 3,
      "y": 2
    },
    {
      "x": 4,
      "y": 3
    },
    {
      "x": 5,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 0,
      "y": 5
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "..##.#.",
    "#......",
    "#.#.#.#",
    "...#..#",
    "...##..",
    "...###.",
    "#####.."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3395815421,
  "sourceCandidateId": "generated-mixed-one-room-7-3395815421",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 32
};

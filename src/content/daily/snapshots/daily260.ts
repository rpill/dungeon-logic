import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-260",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    0,
    2,
    4,
    5,
    2,
    5
  ],
  "columnClues": [
    4,
    4,
    3,
    5,
    0,
    4,
    1
  ],
  "monsters": [
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 2,
      "y": 5
    },
    {
      "x": 4,
      "y": 6
    },
    {
      "x": 6,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 0,
      "y": 1
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "...#.##",
    ".......",
    "...#.#.",
    "####...",
    "####.#.",
    "##.....",
    "####.#."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1293874419,
  "sourceCandidateId": "generated-mixed-one-room-7-1293874419",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 36
};

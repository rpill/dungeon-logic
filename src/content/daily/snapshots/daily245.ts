import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-245",
  "width": 7,
  "height": 7,
  "rowClues": [
    1,
    5,
    1,
    3,
    3,
    4,
    4
  ],
  "columnClues": [
    5,
    5,
    3,
    4,
    2,
    0,
    2
  ],
  "monsters": [
    {
      "x": 1,
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
      "x": 2,
      "y": 4
    }
  ],
  "chests": [
    {
      "x": 4,
      "y": 5
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#......",
    "###.#.#",
    ".#.....",
    "...##.#",
    "##.#...",
    "####...",
    "####..."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3167068049,
  "sourceCandidateId": "generated-mixed-one-room-7-3167068049",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 40
};

import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-239",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    2,
    3,
    4,
    4,
    1,
    3
  ],
  "columnClues": [
    3,
    6,
    2,
    2,
    3,
    2,
    2
  ],
  "monsters": [
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 0,
      "y": 3
    },
    {
      "x": 2,
      "y": 4
    },
    {
      "x": 0,
      "y": 6
    },
    {
      "x": 3,
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
      "y": 2
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "##...#.",
    "##.....",
    "##...#.",
    ".####..",
    ".#.##.#",
    "......#",
    ".##.#.."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 4264303499,
  "sourceCandidateId": "generated-mixed-one-room-7-4264303499",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 62,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 66
};

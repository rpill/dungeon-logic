import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-004",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    1,
    3,
    3,
    3,
    3,
    5
  ],
  "columnClues": [
    5,
    5,
    3,
    1,
    3,
    3,
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
      "x": 5,
      "y": 0
    },
    {
      "x": 0,
      "y": 2
    },
    {
      "x": 5,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 3,
      "y": 5
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#.#.#.#",
    "......#",
    ".##.#..",
    "##...#.",
    "##...#.",
    "##...#.",
    "#####.."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2366879774,
  "sourceCandidateId": "generated-mixed-one-room-7-2366879774",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 43,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 40
};

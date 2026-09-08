import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-032",
  "width": 7,
  "height": 7,
  "rowClues": [
    1,
    4,
    3,
    1,
    3,
    4,
    6
  ],
  "columnClues": [
    5,
    3,
    3,
    3,
    4,
    1,
    3
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
      "y": 5
    },
    {
      "x": 5,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 2,
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
    "####...",
    "#####.#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2413012821,
  "sourceCandidateId": "generated-mixed-one-room-7-2413012821",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 32
};

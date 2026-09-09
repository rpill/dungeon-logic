import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-281",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    1,
    4,
    2,
    2,
    3,
    5
  ],
  "columnClues": [
    5,
    5,
    3,
    3,
    2,
    4,
    0
  ],
  "monsters": [
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
      "y": 3
    },
    {
      "x": 5,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 2,
      "y": 3
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "####.#.",
    "#......",
    "..####.",
    ".#...#.",
    "##.....",
    "##...#.",
    "#####.."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2381034385,
  "sourceCandidateId": "generated-mixed-one-room-7-2381034385",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 32
};

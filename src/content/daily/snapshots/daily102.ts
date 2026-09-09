import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-102",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    3,
    4,
    0,
    4,
    4,
    5
  ],
  "columnClues": [
    6,
    5,
    4,
    3,
    2,
    2,
    2
  ],
  "monsters": [
    {
      "x": 0,
      "y": 3
    },
    {
      "x": 1,
      "y": 4
    },
    {
      "x": 6,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "####...",
    "##...#.",
    "##.#.#.",
    ".......",
    "#.#.#.#",
    "###...#",
    "#####.."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 4201710384,
  "sourceCandidateId": "generated-monster-only-7-4201710384",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 46
};

import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-318",
  "width": 7,
  "height": 7,
  "rowClues": [
    6,
    2,
    3,
    0,
    4,
    2,
    5
  ],
  "columnClues": [
    4,
    4,
    4,
    3,
    2,
    2,
    3
  ],
  "monsters": [
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 0,
      "y": 2
    },
    {
      "x": 0,
      "y": 5
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
    "####.##",
    "##.....",
    ".#.#.#.",
    ".......",
    "#.#.#.#",
    "..#...#",
    "#####.."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2577251782,
  "sourceCandidateId": "generated-monster-only-7-2577251782",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 32
};

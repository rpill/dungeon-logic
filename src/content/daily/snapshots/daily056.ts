import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-056",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    5,
    2,
    2,
    3,
    2,
    2
  ],
  "columnClues": [
    4,
    4,
    3,
    4,
    1,
    4,
    0
  ],
  "monsters": [
    {
      "x": 1,
      "y": 2
    },
    {
      "x": 4,
      "y": 4
    },
    {
      "x": 0,
      "y": 5
    },
    {
      "x": 1,
      "y": 6
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
    "####.#.",
    "#.#....",
    "....##.",
    ".#.#.#.",
    ".#.#...",
    "#....#."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2655229940,
  "sourceCandidateId": "generated-monster-only-7-2655229940",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 57,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 57
};

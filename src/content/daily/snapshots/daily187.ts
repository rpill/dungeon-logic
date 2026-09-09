import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-187",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    2,
    2,
    2,
    2,
    6,
    6
  ],
  "columnClues": [
    4,
    3,
    4,
    3,
    4,
    3,
    1
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 2,
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
    ".#.#...",
    "....#.#",
    "#.#....",
    "....##.",
    "#.#....",
    "######.",
    "######."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 672960149,
  "sourceCandidateId": "generated-monster-only-7-672960149",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 48
};

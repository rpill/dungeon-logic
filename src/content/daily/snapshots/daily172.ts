import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-172",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    2,
    2,
    2,
    2,
    3,
    4
  ],
  "columnClues": [
    3,
    1,
    3,
    2,
    5,
    3,
    3
  ],
  "monsters": [
    {
      "x": 1,
      "y": 0
    },
    {
      "x": 5,
      "y": 0
    },
    {
      "x": 0,
      "y": 1
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
      "x": 0,
      "y": 5
    },
    {
      "x": 6,
      "y": 5
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "#.###.#",
    "....#.#",
    "#.#....",
    "....##.",
    "#.#....",
    ".#..##.",
    "...####"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3548367893,
  "sourceCandidateId": "generated-monster-only-7-3548367893",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 67,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 66
};

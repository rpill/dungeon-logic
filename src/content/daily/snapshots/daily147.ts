import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-147",
  "width": 7,
  "height": 7,
  "rowClues": [
    6,
    3,
    2,
    2,
    1,
    3,
    5
  ],
  "columnClues": [
    3,
    4,
    3,
    5,
    0,
    4,
    3
  ],
  "monsters": [
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 0,
      "y": 1
    },
    {
      "x": 2,
      "y": 1
    },
    {
      "x": 5,
      "y": 1
    },
    {
      "x": 1,
      "y": 5
    },
    {
      "x": 4,
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
    "####.##",
    ".#.#..#",
    ".....##",
    ".#.#...",
    ".....#.",
    "#.##...",
    "####.#."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1903562224,
  "sourceCandidateId": "generated-monster-only-7-1903562224",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 43,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 42
};

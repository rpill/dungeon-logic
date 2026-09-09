import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-211",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    6,
    2,
    5,
    2,
    1,
    3
  ],
  "columnClues": [
    2,
    5,
    5,
    5,
    2,
    1,
    3
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
      "x": 1,
      "y": 2
    },
    {
      "x": 3,
      "y": 2
    },
    {
      "x": 2,
      "y": 4
    },
    {
      "x": 0,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "####...",
    "#####.#",
    "..#...#",
    ".####.#",
    ".#.#...",
    ".....#.",
    ".###..."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3505493588,
  "sourceCandidateId": "generated-monster-only-7-3505493588",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 67,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 66
};

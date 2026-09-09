import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-199",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    2,
    4,
    0,
    4,
    2,
    6
  ],
  "columnClues": [
    2,
    3,
    2,
    3,
    4,
    3,
    6
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 5,
      "y": 0
    },
    {
      "x": 6,
      "y": 3
    },
    {
      "x": 2,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    ".####.#",
    "....#.#",
    "#.#.#.#",
    ".......",
    ".#.#.##",
    ".....##",
    "##.####"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3140321835,
  "sourceCandidateId": "generated-monster-only-7-3140321835",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 57,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 58
};

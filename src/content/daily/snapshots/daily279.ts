import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-279",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    4,
    1,
    5,
    2,
    5,
    4
  ],
  "columnClues": [
    3,
    1,
    3,
    2,
    4,
    4,
    6
  ],
  "monsters": [
    {
      "x": 1,
      "y": 0
    },
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 0,
      "y": 2
    },
    {
      "x": 4,
      "y": 4
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "#.#....",
    "#.#.#.#",
    "......#",
    "#.#.###",
    ".....##",
    ".#.####",
    "...####"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 4285292574,
  "sourceCandidateId": "generated-monster-only-7-4285292574",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 36
};

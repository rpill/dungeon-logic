import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-099",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    2,
    2,
    4,
    1,
    4,
    2
  ],
  "columnClues": [
    2,
    2,
    2,
    2,
    3,
    5,
    4
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
      "x": 6,
      "y": 1
    },
    {
      "x": 6,
      "y": 3
    },
    {
      "x": 5,
      "y": 4
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    ".#.####",
    "....##.",
    "#.#....",
    "#.#.##.",
    "......#",
    ".#.#.##",
    ".....##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3874369745,
  "sourceCandidateId": "generated-monster-only-7-3874369745",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 33,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 34
};

import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-168",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    2,
    2,
    2,
    4,
    3,
    4
  ],
  "columnClues": [
    2,
    2,
    3,
    1,
    6,
    1,
    5
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
      "y": 0
    },
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 0,
      "y": 5
    },
    {
      "x": 5,
      "y": 5
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    ".#.##..",
    "....#.#",
    ".##....",
    "....#.#",
    "#.#.#.#",
    "..#.#.#",
    "#...###"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 86081104,
  "sourceCandidateId": "generated-monster-only-7-86081104",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 48
};

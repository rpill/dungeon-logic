import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-346",
  "width": 7,
  "height": 7,
  "rowClues": [
    6,
    3,
    4,
    4,
    0,
    3,
    0
  ],
  "columnClues": [
    3,
    5,
    3,
    2,
    3,
    4,
    0
  ],
  "monsters": [
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 2,
      "y": 2
    },
    {
      "x": 0,
      "y": 3
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "######.",
    "###....",
    "##..##.",
    ".##.##.",
    ".......",
    ".#.#.#.",
    "......."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 777687717,
  "sourceCandidateId": "generated-monster-only-7-777687717",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 31,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 31
};

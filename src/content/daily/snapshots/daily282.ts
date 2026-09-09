import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-282",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    4,
    0,
    4,
    1,
    5,
    5
  ],
  "columnClues": [
    3,
    2,
    1,
    3,
    4,
    4,
    4
  ],
  "monsters": [
    {
      "x": 4,
      "y": 4
    },
    {
      "x": 6,
      "y": 4
    },
    {
      "x": 0,
      "y": 5
    },
    {
      "x": 1,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "#.....#",
    "#.#.#.#",
    ".......",
    ".#.###.",
    ".....#.",
    ".#.####",
    "#..####"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3981103122,
  "sourceCandidateId": "generated-monster-only-7-3981103122",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 48
};

import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-075",
  "width": 7,
  "height": 7,
  "rowClues": [
    0,
    4,
    0,
    4,
    2,
    6,
    5
  ],
  "columnClues": [
    4,
    3,
    1,
    2,
    3,
    3,
    5
  ],
  "monsters": [
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 3,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    ".......",
    ".#.#.##",
    ".......",
    "#.#.#.#",
    "#.....#",
    "##.####",
    "##..###"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 4056460344,
  "sourceCandidateId": "generated-monster-only-7-4056460344",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 55,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 54
};

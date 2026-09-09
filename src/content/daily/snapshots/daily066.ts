import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-066",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    3,
    5,
    2,
    3,
    1,
    3
  ],
  "columnClues": [
    5,
    3,
    3,
    1,
    4,
    1,
    3
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
      "x": 6,
      "y": 4
    },
    {
      "x": 0,
      "y": 6
    },
    {
      "x": 2,
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
    "#...##.",
    "###....",
    "###.#.#",
    "#.....#",
    "#.#.#..",
    "......#",
    ".#.##.."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 4010115313,
  "sourceCandidateId": "generated-monster-only-7-4010115313",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 55,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 52
};

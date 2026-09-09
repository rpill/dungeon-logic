import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-237",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    0,
    4,
    1,
    3,
    5,
    3
  ],
  "columnClues": [
    2,
    2,
    5,
    5,
    1,
    3,
    2
  ],
  "monsters": [
    {
      "x": 1,
      "y": 0
    },
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 0,
      "y": 1
    },
    {
      "x": 1,
      "y": 6
    },
    {
      "x": 4,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "#.##.#.",
    ".......",
    "#.##.#.",
    ".....#.",
    ".###...",
    ".####.#",
    "..##..#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 253857294,
  "sourceCandidateId": "generated-monster-only-7-253857294",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 57,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 58
};

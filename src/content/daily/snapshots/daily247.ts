import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-247",
  "width": 7,
  "height": 7,
  "rowClues": [
    6,
    3,
    3,
    4,
    0,
    3,
    1
  ],
  "columnClues": [
    4,
    4,
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
      "x": 0,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "######.",
    "###....",
    "#...##.",
    "#.#.##.",
    ".......",
    ".#.#.#.",
    ".#....."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1385040780,
  "sourceCandidateId": "generated-monster-only-7-1385040780",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 59,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 60
};

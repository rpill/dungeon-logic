import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-159",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    3,
    4,
    0,
    4,
    4,
    1
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
      "x": 6,
      "y": 4
    },
    {
      "x": 0,
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
    "...####",
    ".#...##",
    ".#.#.##",
    ".......",
    "#.#.##.",
    "#...###",
    "..#...."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2306383890,
  "sourceCandidateId": "generated-monster-only-7-2306383890",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 46
};

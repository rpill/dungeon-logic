import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-261",
  "width": 7,
  "height": 7,
  "rowClues": [
    6,
    3,
    3,
    1,
    2,
    3,
    4
  ],
  "columnClues": [
    1,
    4,
    0,
    4,
    2,
    6,
    5
  ],
  "monsters": [
    {
      "x": 2,
      "y": 0
    },
    {
      "x": 0,
      "y": 1
    },
    {
      "x": 6,
      "y": 4
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "##.####",
    ".#...##",
    "...#.##",
    ".#.....",
    "...#.#.",
    ".#...##",
    "...####"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1745828296,
  "sourceCandidateId": "generated-monster-only-7-1745828296",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 43,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 42
};

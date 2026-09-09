import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-163",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    1,
    3,
    1,
    3,
    6,
    5
  ],
  "columnClues": [
    2,
    2,
    1,
    5,
    2,
    5,
    4
  ],
  "monsters": [
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 6,
      "y": 3
    },
    {
      "x": 4,
      "y": 4
    },
    {
      "x": 2,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "...#.#.",
    ".#.....",
    "...#.##",
    ".#.....",
    "...#.##",
    "#.#####",
    "#..####"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1774409970,
  "sourceCandidateId": "generated-monster-only-7-1774409970",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 64,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 64
};

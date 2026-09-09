import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-184",
  "width": 7,
  "height": 7,
  "rowClues": [
    0,
    5,
    4,
    3,
    1,
    3,
    6
  ],
  "columnClues": [
    3,
    1,
    3,
    3,
    4,
    3,
    5
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 3,
      "y": 2
    },
    {
      "x": 5,
      "y": 2
    },
    {
      "x": 6,
      "y": 4
    },
    {
      "x": 4,
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
    ".......",
    "#.#.###",
    "#.#.#.#",
    "...##.#",
    ".#.....",
    "...#.##",
    "#.#####"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1054387096,
  "sourceCandidateId": "generated-monster-only-7-1054387096",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 36
};

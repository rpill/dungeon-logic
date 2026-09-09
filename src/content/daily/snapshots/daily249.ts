import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-249",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    4,
    4,
    2,
    2,
    3,
    1
  ],
  "columnClues": [
    2,
    2,
    2,
    2,
    5,
    2,
    5
  ],
  "monsters": [
    {
      "x": 3,
      "y": 1
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
      "x": 0,
      "y": 5
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
    ".#..###",
    ".#.##.#",
    "....#.#",
    "#.#....",
    "..#.#.#",
    "#......"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3346621775,
  "sourceCandidateId": "generated-monster-only-7-3346621775",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 68,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 66
};

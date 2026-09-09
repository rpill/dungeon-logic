import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-123",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    6,
    3,
    2,
    4,
    0,
    4
  ],
  "columnClues": [
    5,
    3,
    2,
    2,
    4,
    4,
    4
  ],
  "monsters": [
    {
      "x": 3,
      "y": 0
    },
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 6,
      "y": 5
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
      "x": 4,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "##..###",
    "##.####",
    "#...##.",
    "#.#....",
    "#.#.#.#",
    ".......",
    ".#.#.##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1398990948,
  "sourceCandidateId": "generated-monster-only-7-1398990948",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 56,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 52
};

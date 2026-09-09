import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-312",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    4,
    4,
    0,
    3,
    0,
    4
  ],
  "columnClues": [
    3,
    3,
    3,
    1,
    3,
    4,
    3
  ],
  "monsters": [
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 0,
      "y": 6
    },
    {
      "x": 3,
      "y": 6
    },
    {
      "x": 5,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "###..##",
    "#...###",
    "#.#.##.",
    ".......",
    ".#.#.#.",
    ".......",
    ".##.#.#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2537481786,
  "sourceCandidateId": "generated-monster-only-7-2537481786",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 59,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 52
};

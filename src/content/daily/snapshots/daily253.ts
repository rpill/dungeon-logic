import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-253",
  "width": 7,
  "height": 7,
  "rowClues": [
    0,
    5,
    4,
    0,
    4,
    1,
    6
  ],
  "columnClues": [
    3,
    3,
    3,
    2,
    4,
    2,
    3
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
      "x": 6,
      "y": 2
    },
    {
      "x": 0,
      "y": 5
    },
    {
      "x": 6,
      "y": 5
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
    ".......",
    "#.#.###",
    "#.#.##.",
    ".......",
    ".#.##.#",
    ".#.....",
    "#####.#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 676874908,
  "sourceCandidateId": "generated-monster-only-7-676874908",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 46
};

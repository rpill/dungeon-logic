import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-304",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    2,
    4,
    0,
    4,
    5,
    5
  ],
  "columnClues": [
    2,
    2,
    5,
    1,
    5,
    5,
    2
  ],
  "monsters": [
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 6,
      "y": 4
    },
    {
      "x": 3,
      "y": 5
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
    "....##.",
    ".##....",
    ".##.##.",
    ".......",
    "#.#.##.",
    "#.#.###",
    "..#####"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2461553266,
  "sourceCandidateId": "generated-monster-only-7-2461553266",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 59,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 60
};

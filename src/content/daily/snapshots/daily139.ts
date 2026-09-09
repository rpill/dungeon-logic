import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-139",
  "width": 7,
  "height": 7,
  "rowClues": [
    0,
    4,
    4,
    1,
    4,
    2,
    6
  ],
  "columnClues": [
    6,
    3,
    3,
    3,
    2,
    4,
    0
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 1,
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
    ".......",
    "##.#.#.",
    "##.#.#.",
    "#......",
    "#.#.##.",
    "#.#....",
    "######."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2953094757,
  "sourceCandidateId": "generated-monster-only-7-2953094757",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 46
};

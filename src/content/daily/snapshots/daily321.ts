import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-321",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    6,
    3,
    4,
    1,
    3,
    1
  ],
  "columnClues": [
    2,
    3,
    1,
    3,
    4,
    3,
    6
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 0,
      "y": 2
    },
    {
      "x": 4,
      "y": 2
    },
    {
      "x": 5,
      "y": 3
    },
    {
      "x": 6,
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
    "...####",
    "##.####",
    ".#...##",
    ".#.##.#",
    "......#",
    "#.#.#..",
    "......#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3437397374,
  "sourceCandidateId": "generated-monster-only-7-3437397374",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 32
};

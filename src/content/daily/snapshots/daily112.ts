import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-112",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    5,
    3,
    2,
    4,
    0,
    4
  ],
  "columnClues": [
    1,
    3,
    3,
    1,
    4,
    3,
    5
  ],
  "monsters": [
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 1,
      "y": 6
    },
    {
      "x": 3,
      "y": 6
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
    ".....##",
    ".##.###",
    ".##...#",
    "....#.#",
    ".#.##.#",
    ".......",
    "#.#.##."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2736357023,
  "sourceCandidateId": "generated-monster-only-7-2736357023",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 56,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 54
};

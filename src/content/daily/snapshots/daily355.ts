import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-355",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    4,
    3,
    4,
    0,
    3,
    2
  ],
  "columnClues": [
    4,
    5,
    1,
    5,
    0,
    4,
    1
  ],
  "monsters": [
    {
      "x": 2,
      "y": 1
    },
    {
      "x": 6,
      "y": 5
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "####...",
    "##.#.#.",
    "##.#...",
    "##.#.#.",
    ".......",
    ".#.#.#.",
    ".....##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1902429391,
  "sourceCandidateId": "generated-monster-only-7-1902429391",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 31,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 31
};

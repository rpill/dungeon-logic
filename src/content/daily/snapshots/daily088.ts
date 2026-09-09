import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-088",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    4,
    4,
    0,
    4,
    2,
    2
  ],
  "columnClues": [
    4,
    3,
    4,
    1,
    4,
    2,
    2
  ],
  "monsters": [
    {
      "x": 3,
      "y": 0
    },
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 1,
      "y": 2
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
    "###.#..",
    "###...#",
    "#.#.#.#",
    ".......",
    ".#.###.",
    "....##.",
    "#.#...."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2632506242,
  "sourceCandidateId": "generated-monster-only-7-2632506242",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 33,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 36
};

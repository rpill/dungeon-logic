import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-005",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    2,
    4,
    3,
    2,
    2,
    3
  ],
  "columnClues": [
    6,
    3,
    3,
    3,
    1,
    4,
    0
  ],
  "monsters": [
    {
      "x": 1,
      "y": 1
    },
    {
      "x": 2,
      "y": 2
    },
    {
      "x": 0,
      "y": 4
    },
    {
      "x": 2,
      "y": 6
    },
    {
      "x": 4,
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
    "####...",
    "#....#.",
    "##.#.#.",
    "###....",
    "....##.",
    "#.#....",
    "#..#.#."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 581019942,
  "sourceCandidateId": "generated-monster-only-7-581019942",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 38
};

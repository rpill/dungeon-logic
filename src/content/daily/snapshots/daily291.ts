import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-291",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    2,
    4,
    1,
    3,
    2,
    4
  ],
  "columnClues": [
    6,
    3,
    2,
    3,
    2,
    4,
    0
  ],
  "monsters": [
    {
      "x": 2,
      "y": 0
    },
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 6,
      "y": 0
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
      "x": 6,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "##.#.#.",
    "##.....",
    "##.#.#.",
    "#......",
    "..#.##.",
    "#.#....",
    "#..###."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2352927977,
  "sourceCandidateId": "generated-monster-only-7-2352927977",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 46
};

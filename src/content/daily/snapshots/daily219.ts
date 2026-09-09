import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-219",
  "width": 7,
  "height": 7,
  "rowClues": [
    0,
    4,
    2,
    2,
    4,
    6,
    4
  ],
  "columnClues": [
    2,
    2,
    4,
    2,
    5,
    2,
    5
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
      "y": 3
    },
    {
      "x": 3,
      "y": 4
    },
    {
      "x": 5,
      "y": 4
    },
    {
      "x": 2,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    ".......",
    "#.#.#.#",
    "#.....#",
    "..#.#..",
    ".##.#.#",
    ".######",
    "...####"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3588856032,
  "sourceCandidateId": "generated-monster-only-7-3588856032",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 59,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 58
};

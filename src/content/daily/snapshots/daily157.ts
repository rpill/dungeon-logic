import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-157",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    2,
    2,
    2,
    3,
    4,
    5
  ],
  "columnClues": [
    4,
    1,
    4,
    1,
    4,
    1,
    6
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 0,
      "y": 3
    },
    {
      "x": 3,
      "y": 5
    },
    {
      "x": 5,
      "y": 5
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
    ".##...#",
    "....#.#",
    "#.#....",
    "....#.#",
    "#.#...#",
    "#.#.#.#",
    "#..####"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1040990644,
  "sourceCandidateId": "generated-monster-only-7-1040990644",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 43,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 40
};

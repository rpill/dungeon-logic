import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-274",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    1,
    4,
    0,
    3,
    3,
    6
  ],
  "columnClues": [
    1,
    5,
    3,
    4,
    3,
    3,
    3
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 2,
      "y": 0
    },
    {
      "x": 2,
      "y": 4
    },
    {
      "x": 0,
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
    ".#.####",
    "......#",
    ".##.#.#",
    ".......",
    ".#.#.#.",
    ".###...",
    "######."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2105199557,
  "sourceCandidateId": "generated-monster-only-7-2105199557",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 57,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 52
};

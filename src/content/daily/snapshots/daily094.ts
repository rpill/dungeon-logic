import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-094",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    1,
    4,
    0,
    5,
    5,
    3
  ],
  "columnClues": [
    3,
    4,
    1,
    3,
    5,
    3,
    4
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
      "x": 4,
      "y": 1
    },
    {
      "x": 6,
      "y": 1
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
      "x": 5,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    ".#.####",
    ".....#.",
    ".##.##.",
    ".......",
    "##.##.#",
    "##.##.#",
    "#...#.#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2510836959,
  "sourceCandidateId": "generated-monster-only-7-2510836959",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 56,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 54
};

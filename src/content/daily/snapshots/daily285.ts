import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-285",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    5,
    1,
    5,
    2,
    2,
    3
  ],
  "columnClues": [
    4,
    1,
    4,
    1,
    4,
    4,
    4
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 3,
      "y": 0
    },
    {
      "x": 0,
      "y": 2
    },
    {
      "x": 5,
      "y": 2
    },
    {
      "x": 0,
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
    "..#.###",
    "#.#.###",
    "......#",
    "#.#.###",
    "..#.#..",
    "#....#.",
    "##.#..."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2700619788,
  "sourceCandidateId": "generated-monster-only-7-2700619788",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 59,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 60
};

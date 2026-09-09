import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-348",
  "width": 7,
  "height": 7,
  "rowClues": [
    1,
    3,
    2,
    4,
    2,
    6,
    2
  ],
  "columnClues": [
    3,
    0,
    4,
    1,
    3,
    3,
    6
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
      "x": 0,
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
      "x": 0,
      "y": 6
    },
    {
      "x": 4,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "..#....",
    "#...#.#",
    "..#...#",
    "#...###",
    "..#...#",
    "#.#####",
    ".....##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2089260581,
  "sourceCandidateId": "generated-monster-only-7-2089260581",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 31,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 31
};

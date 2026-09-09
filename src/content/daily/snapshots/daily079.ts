import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-079",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    3,
    2,
    2,
    4,
    5,
    4
  ],
  "columnClues": [
    5,
    1,
    4,
    1,
    5,
    2,
    5
  ],
  "monsters": [
    {
      "x": 6,
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
      "y": 4
    },
    {
      "x": 5,
      "y": 4
    },
    {
      "x": 0,
      "y": 5
    },
    {
      "x": 3,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "###....",
    "#...#.#",
    "#.#....",
    "....#.#",
    "#.#.#.#",
    "..#####",
    "#...###"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2740271782,
  "sourceCandidateId": "generated-monster-only-7-2740271782",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 33,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 34
};

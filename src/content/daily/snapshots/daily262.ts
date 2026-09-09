import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-262",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    2,
    4,
    2,
    3,
    3,
    4
  ],
  "columnClues": [
    5,
    2,
    4,
    0,
    3,
    2,
    6
  ],
  "monsters": [
    {
      "x": 1,
      "y": 1
    },
    {
      "x": 6,
      "y": 1
    },
    {
      "x": 0,
      "y": 3
    },
    {
      "x": 0,
      "y": 5
    },
    {
      "x": 1,
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
    "###...#",
    "#...#..",
    "###...#",
    "....#.#",
    "#.#...#",
    "....###",
    "#.#..##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2172441308,
  "sourceCandidateId": "generated-monster-only-7-2172441308",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 48
};

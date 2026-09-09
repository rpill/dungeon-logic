import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-106",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    3,
    4,
    4,
    2,
    5,
    1
  ],
  "columnClues": [
    6,
    2,
    4,
    2,
    2,
    2,
    3
  ],
  "monsters": [
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 1,
      "y": 2
    },
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 1,
      "y": 4
    },
    {
      "x": 6,
      "y": 4
    },
    {
      "x": 0,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "#....#.",
    "#.##...",
    "#.##.#.",
    "###...#",
    "#...#..",
    "###.#.#",
    "......#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 262802607,
  "sourceCandidateId": "generated-monster-only-7-262802607",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 64,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 64
};

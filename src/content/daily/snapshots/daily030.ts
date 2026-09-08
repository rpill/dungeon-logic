import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-030",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    3,
    3,
    5,
    1,
    3,
    1
  ],
  "columnClues": [
    5,
    3,
    4,
    1,
    2,
    4,
    2
  ],
  "monsters": [
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 1,
      "y": 1
    },
    {
      "x": 5,
      "y": 1
    },
    {
      "x": 0,
      "y": 4
    },
    {
      "x": 0,
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
    "###..##",
    "#...#.#",
    "###....",
    "###.##.",
    ".....#.",
    "#.##...",
    ".....#."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2397203802,
  "sourceCandidateId": "generated-monster-only-7-2397203802",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 62,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 64
};

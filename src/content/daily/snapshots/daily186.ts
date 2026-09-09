import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-186",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    3,
    5,
    0,
    4,
    4,
    5
  ],
  "columnClues": [
    6,
    6,
    3,
    3,
    2,
    2,
    3
  ],
  "monsters": [
    {
      "x": 6,
      "y": 1
    },
    {
      "x": 0,
      "y": 3
    },
    {
      "x": 2,
      "y": 4
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
    "###...#",
    "##..#..",
    "##.##.#",
    ".......",
    "##.#.#.",
    "####...",
    "###..##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 4200492097,
  "sourceCandidateId": "generated-monster-only-7-4200492097",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 43,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 42
};

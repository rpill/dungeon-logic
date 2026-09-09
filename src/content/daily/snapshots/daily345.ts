import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-345",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    6,
    4,
    2,
    3,
    3,
    4
  ],
  "columnClues": [
    6,
    5,
    4,
    4,
    0,
    3,
    4
  ],
  "monsters": [
    {
      "x": 3,
      "y": 0
    },
    {
      "x": 5,
      "y": 0
    },
    {
      "x": 1,
      "y": 2
    },
    {
      "x": 5,
      "y": 2
    },
    {
      "x": 0,
      "y": 3
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "###...#",
    "####.##",
    "#.##..#",
    ".....##",
    "##.#...",
    "##...#.",
    "####..."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3682735940,
  "sourceCandidateId": "generated-monster-only-7-3682735940",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 31,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 34
};

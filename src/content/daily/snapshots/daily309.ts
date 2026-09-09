import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-309",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    4,
    4,
    3,
    2,
    2,
    4
  ],
  "columnClues": [
    6,
    3,
    4,
    1,
    2,
    5,
    0
  ],
  "monsters": [
    {
      "x": 1,
      "y": 0
    },
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 0,
      "y": 5
    },
    {
      "x": 4,
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
    "#....#.",
    "####...",
    "###..#.",
    "#...##.",
    "#.#....",
    "....##.",
    "###..#."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 243706671,
  "sourceCandidateId": "generated-monster-only-7-243706671",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 40
};

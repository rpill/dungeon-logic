import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-174",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    5,
    1,
    4,
    5,
    2,
    6
  ],
  "columnClues": [
    2,
    2,
    4,
    1,
    4,
    6,
    6
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 4,
      "y": 5
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
    ".....##",
    "#.#.###",
    "#......",
    "..#.###",
    ".##.###",
    ".....##",
    ".######"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 292068052,
  "sourceCandidateId": "generated-monster-only-7-292068052",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 34
};

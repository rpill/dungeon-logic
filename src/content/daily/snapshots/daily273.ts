import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-273",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    2,
    3,
    1,
    3,
    2,
    5
  ],
  "columnClues": [
    2,
    3,
    3,
    3,
    1,
    5,
    4
  ],
  "monsters": [
    {
      "x": 2,
      "y": 0
    },
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 1,
      "y": 6
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
    "##.#.##",
    ".....##",
    ".###...",
    ".....#.",
    ".###...",
    ".....##",
    "#.#.###"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2007869613,
  "sourceCandidateId": "generated-monster-only-7-2007869613",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 46
};

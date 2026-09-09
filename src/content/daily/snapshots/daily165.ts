import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-165",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    3,
    6,
    1,
    5,
    4,
    3
  ],
  "columnClues": [
    5,
    5,
    4,
    2,
    2,
    2,
    4
  ],
  "monsters": [
    {
      "x": 0,
      "y": 1
    },
    {
      "x": 6,
      "y": 1
    },
    {
      "x": 1,
      "y": 3
    },
    {
      "x": 6,
      "y": 3
    },
    {
      "x": 6,
      "y": 5
    },
    {
      "x": 2,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    ".....##",
    ".###...",
    "####.##",
    "#......",
    "###.#.#",
    "###.#..",
    "##....#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2222774165,
  "sourceCandidateId": "generated-monster-only-7-2222774165",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 36
};

import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-142",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    3,
    1,
    3,
    3,
    5,
    6
  ],
  "columnClues": [
    5,
    4,
    2,
    4,
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
      "x": 0,
      "y": 1
    },
    {
      "x": 4,
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
    "##...##",
    ".###...",
    ".....#.",
    "#.##...",
    "#....##",
    "##.#.##",
    "##.####"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2300476549,
  "sourceCandidateId": "generated-monster-only-7-2300476549",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 59,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 58
};

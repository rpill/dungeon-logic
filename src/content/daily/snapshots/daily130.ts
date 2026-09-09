import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-130",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    4,
    4,
    3,
    2,
    3,
    1
  ],
  "columnClues": [
    2,
    4,
    0,
    4,
    3,
    4,
    5
  ],
  "monsters": [
    {
      "x": 1,
      "y": 0
    },
    {
      "x": 4,
      "y": 1
    },
    {
      "x": 6,
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
    "#..####",
    "##...##",
    "...####",
    ".#...##",
    ".#.#...",
    "...##.#",
    ".#....."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2559635520,
  "sourceCandidateId": "generated-monster-only-7-2559635520",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 48
};

import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-093",
  "width": 7,
  "height": 7,
  "rowClues": [
    1,
    4,
    1,
    4,
    2,
    5,
    4
  ],
  "columnClues": [
    3,
    1,
    2,
    2,
    4,
    4,
    5
  ],
  "monsters": [
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 0,
      "y": 1
    },
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 5,
      "y": 3
    },
    {
      "x": 4,
      "y": 4
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "#......",
    "..#.###",
    "#......",
    "#.#.#.#",
    ".....##",
    ".#.####",
    "...####"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2754267475,
  "sourceCandidateId": "generated-monster-only-7-2754267475",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 45,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 48
};

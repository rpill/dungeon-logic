import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-141",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    5,
    4,
    5,
    1,
    3,
    1
  ],
  "columnClues": [
    4,
    2,
    1,
    2,
    3,
    5,
    4
  ],
  "monsters": [
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 0,
      "y": 1
    },
    {
      "x": 1,
      "y": 2
    },
    {
      "x": 3,
      "y": 2
    },
    {
      "x": 4,
      "y": 3
    },
    {
      "x": 0,
      "y": 5
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    ".....##",
    ".#.####",
    "#...###",
    "##.#.##",
    "#......",
    "..#.##.",
    "#......"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 445321514,
  "sourceCandidateId": "generated-monster-only-7-445321514",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 56,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 52
};

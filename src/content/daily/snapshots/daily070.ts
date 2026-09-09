import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-070",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    2,
    2,
    2,
    4,
    4,
    6
  ],
  "columnClues": [
    2,
    4,
    5,
    2,
    5,
    4,
    1
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 3,
      "y": 4
    },
    {
      "x": 0,
      "y": 5
    },
    {
      "x": 5,
      "y": 5
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
    "....###",
    "#.#....",
    "....##.",
    ".##....",
    ".##.##.",
    ".####..",
    "######."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2029739932,
  "sourceCandidateId": "generated-monster-only-7-2029739932",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 33,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 36
};

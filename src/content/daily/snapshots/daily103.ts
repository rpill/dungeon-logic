import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-103",
  "width": 7,
  "height": 7,
  "rowClues": [
    6,
    3,
    4,
    2,
    2,
    4,
    0
  ],
  "columnClues": [
    5,
    2,
    5,
    2,
    3,
    4,
    0
  ],
  "monsters": [
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 3,
      "y": 1
    },
    {
      "x": 1,
      "y": 2
    },
    {
      "x": 0,
      "y": 4
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
    "######.",
    "###....",
    "#.##.#.",
    "#.#....",
    "....##.",
    "#.#.##.",
    "......."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2403260834,
  "sourceCandidateId": "generated-monster-only-7-2403260834",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 56,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 52
};

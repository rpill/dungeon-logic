import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-064",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    4,
    5,
    2,
    2,
    3,
    1
  ],
  "columnClues": [
    0,
    4,
    2,
    2,
    2,
    5,
    5
  ],
  "monsters": [
    {
      "x": 1,
      "y": 0
    },
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 2,
      "y": 1
    },
    {
      "x": 6,
      "y": 5
    },
    {
      "x": 5,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "..#..##",
    ".#..###",
    ".##.###",
    ".....##",
    ".#.#...",
    ".#.#.#.",
    "......#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2955620931,
  "sourceCandidateId": "generated-monster-only-7-2955620931",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 45,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 46
};

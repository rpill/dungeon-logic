import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-280",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    3,
    3,
    3,
    1,
    4,
    1
  ],
  "columnClues": [
    3,
    3,
    3,
    3,
    4,
    0,
    4
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
      "x": 3,
      "y": 1
    },
    {
      "x": 6,
      "y": 3
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
    "#####..",
    ".##...#",
    "...##.#",
    ".#.##..",
    "......#",
    "#.#.#.#",
    "#......"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3279364204,
  "sourceCandidateId": "generated-monster-only-7-3279364204",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 42
};

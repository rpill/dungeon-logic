import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-115",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    4,
    2,
    3,
    3,
    2,
    4
  ],
  "columnClues": [
    2,
    5,
    2,
    2,
    4,
    2,
    4
  ],
  "monsters": [
    {
      "x": 2,
      "y": 1
    },
    {
      "x": 0,
      "y": 2
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "###....",
    "##..##.",
    ".##....",
    ".#..#.#",
    "...##.#",
    ".#....#",
    "...####"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2628280292,
  "sourceCandidateId": "generated-monster-only-7-2628280292",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 66,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 66
};

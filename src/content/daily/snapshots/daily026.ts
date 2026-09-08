import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-026",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    2,
    2,
    4,
    4,
    2,
    4
  ],
  "columnClues": [
    1,
    3,
    2,
    2,
    4,
    4,
    4
  ],
  "monsters": [
    {
      "x": 1,
      "y": 0
    },
    {
      "x": 5,
      "y": 5
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "#.#....",
    "....##.",
    ".##....",
    ".#..###",
    "...####",
    ".#....#",
    "...####"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 817878084,
  "sourceCandidateId": "generated-monster-only-7-817878084",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 58,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 58
};

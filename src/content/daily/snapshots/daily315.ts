import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-315",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    4,
    2,
    4,
    0,
    5,
    3
  ],
  "columnClues": [
    1,
    3,
    1,
    2,
    4,
    5,
    6
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 3,
      "y": 0
    },
    {
      "x": 5,
      "y": 2
    },
    {
      "x": 6,
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
    ".#..###",
    "...####",
    ".#....#",
    ".#.#.##",
    ".......",
    "#.#.###",
    "....###"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1723782923,
  "sourceCandidateId": "generated-monster-only-7-1723782923",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 59,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 64
};

import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-265",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    3,
    4,
    1,
    3,
    1,
    4
  ],
  "columnClues": [
    0,
    4,
    0,
    4,
    2,
    5,
    5
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
      "x": 4,
      "y": 1
    },
    {
      "x": 6,
      "y": 5
    },
    {
      "x": 0,
      "y": 6
    },
    {
      "x": 2,
      "y": 6
    },
    {
      "x": 4,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    ".#..###",
    "...#.##",
    ".#.#.##",
    "......#",
    ".#.##..",
    ".....#.",
    ".#.#.##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 434343963,
  "sourceCandidateId": "generated-monster-only-7-434343963",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 59,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 60
};

import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-020",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    3,
    1,
    4,
    3,
    4,
    4
  ],
  "columnClues": [
    4,
    3,
    3,
    3,
    1,
    2,
    5
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 2,
      "y": 0
    },
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 0,
      "y": 3
    },
    {
      "x": 5,
      "y": 4
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
    ".#....#",
    "..#.#.#",
    "#......",
    "..##.##",
    "#..#..#",
    "##...##",
    "####..."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 751838800,
  "sourceCandidateId": "generated-monster-only-7-751838800",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 40
};

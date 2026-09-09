import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-363",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    3,
    3,
    3,
    2,
    4,
    0
  ],
  "columnClues": [
    2,
    3,
    0,
    4,
    1,
    4,
    6
  ],
  "monsters": [
    {
      "x": 1,
      "y": 0
    },
    {
      "x": 5,
      "y": 1
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
    "#..####",
    "##....#",
    "...#.##",
    ".#...##",
    "...#..#",
    ".#.#.##",
    "......."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1762458820,
  "sourceCandidateId": "generated-monster-only-7-1762458820",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 31,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 31
};

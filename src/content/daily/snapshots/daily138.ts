import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-138",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    5,
    3,
    4,
    2,
    2,
    2
  ],
  "columnClues": [
    2,
    6,
    2,
    4,
    0,
    4,
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
      "x": 5,
      "y": 4
    },
    {
      "x": 6,
      "y": 5
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "####...",
    ".###.##",
    ".#...##",
    ".#.#.##",
    ".#....#",
    "...#.#.",
    "##....."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 936943763,
  "sourceCandidateId": "generated-monster-only-7-936943763",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 43,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 40
};

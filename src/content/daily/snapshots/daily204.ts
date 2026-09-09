import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-204",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    4,
    0,
    4,
    2,
    6,
    3
  ],
  "columnClues": [
    4,
    3,
    2,
    2,
    2,
    2,
    6
  ],
  "monsters": [
    {
      "x": 5,
      "y": 0
    },
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 2,
      "y": 6
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
    "...#..#",
    ".#.#.##",
    ".......",
    "#.#.#.#",
    "#.....#",
    "###.###",
    "##....#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1903268034,
  "sourceCandidateId": "generated-monster-only-7-1903268034",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 43,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 42
};

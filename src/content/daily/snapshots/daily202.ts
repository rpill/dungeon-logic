import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-202",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    2,
    3,
    1,
    3,
    2,
    5
  ],
  "columnClues": [
    3,
    4,
    3,
    2,
    3,
    1,
    4
  ],
  "monsters": [
    {
      "x": 3,
      "y": 0
    },
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 6,
      "y": 4
    },
    {
      "x": 0,
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
    "###.#..",
    "#.....#",
    "#.#.#..",
    "......#",
    ".#.##..",
    ".#....#",
    ".###.##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1920339843,
  "sourceCandidateId": "generated-monster-only-7-1920339843",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 36
};

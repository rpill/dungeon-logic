import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-183",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    4,
    2,
    5,
    3,
    2,
    2
  ],
  "columnClues": [
    1,
    2,
    1,
    3,
    3,
    6,
    5
  ],
  "monsters": [
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 0,
      "y": 6
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
    "...#.##",
    ".#.#.##",
    ".....##",
    ".#.####",
    "....###",
    "#.#....",
    "....##."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3285957518,
  "sourceCandidateId": "generated-monster-only-7-3285957518",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 65,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 64
};

import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-235",
  "width": 7,
  "height": 7,
  "rowClues": [
    1,
    2,
    2,
    3,
    3,
    6,
    5
  ],
  "columnClues": [
    2,
    5,
    1,
    2,
    2,
    5,
    5
  ],
  "monsters": [
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 5,
      "y": 3
    },
    {
      "x": 0,
      "y": 4
    },
    {
      "x": 2,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    ".....#.",
    ".#.#...",
    ".....##",
    ".#.#..#",
    ".#...##",
    "###.###",
    "##..###"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1802602320,
  "sourceCandidateId": "generated-monster-only-7-1802602320",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 57,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 52
};

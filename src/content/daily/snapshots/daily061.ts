import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-061",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    2,
    3,
    2,
    2,
    3,
    3
  ],
  "columnClues": [
    2,
    4,
    3,
    0,
    4,
    2,
    5
  ],
  "monsters": [
    {
      "x": 2,
      "y": 0
    },
    {
      "x": 0,
      "y": 1
    },
    {
      "x": 6,
      "y": 1
    },
    {
      "x": 2,
      "y": 2
    },
    {
      "x": 6,
      "y": 3
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
    "##..###",
    ".##....",
    ".#..#.#",
    ".##....",
    "....#.#",
    "#.#...#",
    "....###"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2634347955,
  "sourceCandidateId": "generated-monster-only-7-2634347955",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 33,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 34
};

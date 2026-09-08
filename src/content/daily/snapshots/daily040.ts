import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-040",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    3,
    2,
    2,
    3,
    5,
    6
  ],
  "columnClues": [
    5,
    4,
    5,
    1,
    5,
    0,
    5
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
      "x": 0,
      "y": 4
    },
    {
      "x": 3,
      "y": 5
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
    "###.#..",
    "#...#.#",
    "#.#....",
    "....#.#",
    ".##...#",
    "###.#.#",
    "#####.#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2342509615,
  "sourceCandidateId": "generated-monster-only-7-2342509615",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 56,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 54
};

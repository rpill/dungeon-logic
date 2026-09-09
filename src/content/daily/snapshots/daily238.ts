import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-238",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    4,
    4,
    2,
    3,
    1,
    2
  ],
  "columnClues": [
    1,
    6,
    4,
    3,
    3,
    1,
    3
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
      "x": 4,
      "y": 1
    },
    {
      "x": 3,
      "y": 2
    },
    {
      "x": 2,
      "y": 3
    },
    {
      "x": 0,
      "y": 6
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
    "#####..",
    ".###..#",
    ".##.#.#",
    ".#....#",
    ".##.#..",
    ".....#.",
    ".#.#..."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2273254117,
  "sourceCandidateId": "generated-monster-only-7-2273254117",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 63,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 64
};

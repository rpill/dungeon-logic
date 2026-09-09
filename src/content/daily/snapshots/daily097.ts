import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-097",
  "width": 7,
  "height": 7,
  "rowClues": [
    6,
    4,
    1,
    4,
    1,
    2,
    2
  ],
  "columnClues": [
    2,
    4,
    4,
    1,
    3,
    2,
    4
  ],
  "monsters": [
    {
      "x": 3,
      "y": 0
    },
    {
      "x": 0,
      "y": 1
    },
    {
      "x": 5,
      "y": 1
    },
    {
      "x": 1,
      "y": 6
    },
    {
      "x": 3,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "###.###",
    ".##.#.#",
    "......#",
    ".##.#.#",
    ".#.....",
    "...#.#.",
    "#.#...."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 664161931,
  "sourceCandidateId": "generated-monster-only-7-664161931",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 66,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 66
};

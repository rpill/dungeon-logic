import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-087",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    1,
    4,
    0,
    4,
    3,
    5
  ],
  "columnClues": [
    3,
    3,
    5,
    1,
    4,
    2,
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
      "y": 3
    },
    {
      "x": 1,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "###.##.",
    "#......",
    "#.#.#.#",
    ".......",
    ".##.#.#",
    ".##...#",
    "..#####"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3791859171,
  "sourceCandidateId": "generated-monster-only-7-3791859171",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 64,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 64
};

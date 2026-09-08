import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-021",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    1,
    3,
    1,
    2,
    4,
    6
  ],
  "columnClues": [
    2,
    4,
    0,
    4,
    3,
    3,
    4
  ],
  "monsters": [
    {
      "x": 5,
      "y": 0
    },
    {
      "x": 6,
      "y": 1
    },
    {
      "x": 6,
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
    "...##.#",
    ".#.....",
    "...##.#",
    ".#.....",
    "...#.#.",
    "##...##",
    "##.####"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2099142525,
  "sourceCandidateId": "generated-monster-only-7-2099142525",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 46
};

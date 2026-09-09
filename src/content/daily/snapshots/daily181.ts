import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-181",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    1,
    4,
    1,
    3,
    2,
    5
  ],
  "columnClues": [
    4,
    3,
    4,
    0,
    4,
    3,
    3
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
      "x": 5,
      "y": 5
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
    "###.##.",
    "#......",
    "#.#.##.",
    "....#..",
    ".##...#",
    "....#.#",
    "###..##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2593043663,
  "sourceCandidateId": "generated-monster-only-7-2593043663",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 57,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 58
};

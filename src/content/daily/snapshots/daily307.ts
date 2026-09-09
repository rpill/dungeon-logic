import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-307",
  "width": 7,
  "height": 7,
  "rowClues": [
    6,
    3,
    4,
    0,
    3,
    1,
    3
  ],
  "columnClues": [
    0,
    4,
    2,
    3,
    3,
    5,
    3
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 6,
      "y": 2
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
    ".######",
    "....###",
    ".##.##.",
    ".......",
    ".#.#.#.",
    ".#.....",
    "...#.##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 304631436,
  "sourceCandidateId": "generated-monster-only-7-304631436",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 34
};

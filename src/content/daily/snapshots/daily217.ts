import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-217",
  "width": 7,
  "height": 7,
  "rowClues": [
    6,
    2,
    5,
    1,
    4,
    2,
    2
  ],
  "columnClues": [
    0,
    4,
    3,
    3,
    3,
    3,
    6
  ],
  "monsters": [
    {
      "x": 0,
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
    ".######",
    ".....##",
    ".###.##",
    "......#",
    ".#.##.#",
    "....#.#",
    ".##...."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 537837128,
  "sourceCandidateId": "generated-monster-only-7-537837128",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 57,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 52
};

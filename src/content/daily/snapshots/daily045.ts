import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-045",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    4,
    3,
    3,
    3,
    2,
    2
  ],
  "columnClues": [
    2,
    1,
    3,
    0,
    4,
    5,
    5
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 4,
      "y": 1
    },
    {
      "x": 5,
      "y": 3
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
    "....###",
    "#.#..##",
    "....###",
    ".##...#",
    "....###",
    "#.#....",
    "....##."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 43534527,
  "sourceCandidateId": "generated-monster-only-7-43534527",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 65,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 66
};

import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-228",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    3,
    4,
    0,
    4,
    3,
    4
  ],
  "columnClues": [
    1,
    3,
    2,
    2,
    3,
    4,
    6
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 5,
      "y": 0
    },
    {
      "x": 5,
      "y": 2
    },
    {
      "x": 6,
      "y": 3
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    ".##...#",
    "....###",
    "#.#.#.#",
    ".......",
    ".#.#.##",
    ".#...##",
    "...####"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 261731415,
  "sourceCandidateId": "generated-monster-only-7-261731415",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 59,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 60
};

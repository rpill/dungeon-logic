import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-189",
  "width": 7,
  "height": 7,
  "rowClues": [
    6,
    4,
    2,
    1,
    3,
    2,
    2
  ],
  "columnClues": [
    3,
    2,
    2,
    4,
    3,
    4,
    2
  ],
  "monsters": [
    {
      "x": 2,
      "y": 0
    },
    {
      "x": 5,
      "y": 4
    },
    {
      "x": 0,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "##.####",
    "...####",
    ".#.#...",
    ".....#.",
    "#.#.#..",
    "#....#.",
    "..##..."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 363762511,
  "sourceCandidateId": "generated-monster-only-7-363762511",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 57,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 54
};

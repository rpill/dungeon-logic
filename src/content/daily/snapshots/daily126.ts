import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-126",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    3,
    1,
    3,
    2,
    5,
    4
  ],
  "columnClues": [
    2,
    2,
    1,
    5,
    2,
    6,
    2
  ],
  "monsters": [
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 4,
      "y": 4
    },
    {
      "x": 6,
      "y": 4
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "#....#.",
    "#.##...",
    ".....#.",
    ".#.#.#.",
    "...#.#.",
    ".#.####",
    "...####"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 437171414,
  "sourceCandidateId": "generated-monster-only-7-437171414",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 64,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 64
};

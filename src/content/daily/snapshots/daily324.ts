import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-324",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    2,
    3,
    3,
    5,
    2,
    4
  ],
  "columnClues": [
    0,
    4,
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
      "x": 6,
      "y": 0
    },
    {
      "x": 0,
      "y": 6
    },
    {
      "x": 2,
      "y": 6
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
    ".##....",
    "....#.#",
    ".##...#",
    "....###",
    ".#.####",
    ".....##",
    ".#.#.##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1057915358,
  "sourceCandidateId": "generated-monster-only-7-1057915358",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 32
};

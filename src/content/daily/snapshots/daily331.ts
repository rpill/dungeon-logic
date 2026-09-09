import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-331",
  "width": 7,
  "height": 7,
  "rowClues": [
    1,
    2,
    4,
    3,
    3,
    5,
    3
  ],
  "columnClues": [
    4,
    5,
    4,
    2,
    2,
    2,
    2
  ],
  "monsters": [
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 2,
      "y": 1
    },
    {
      "x": 0,
      "y": 2
    },
    {
      "x": 1,
      "y": 4
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
    ".....#.",
    ".#.#...",
    ".###.#.",
    "###....",
    "#...#.#",
    "###.#.#",
    "###...."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2341780841,
  "sourceCandidateId": "generated-monster-only-7-2341780841",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 32
};

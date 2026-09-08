import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-035",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    6,
    2,
    4,
    0,
    4,
    1
  ],
  "columnClues": [
    6,
    3,
    3,
    1,
    2,
    2,
    3
  ],
  "monsters": [
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 0,
      "y": 4
    },
    {
      "x": 1,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "###....",
    "###.###",
    "#.....#",
    "#.#.#.#",
    ".......",
    "##.#.#.",
    "#......"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 47470392,
  "sourceCandidateId": "generated-monster-only-7-47470392",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 43,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 42
};

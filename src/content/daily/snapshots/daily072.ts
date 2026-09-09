import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-072",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    1,
    3,
    0,
    4,
    5,
    5
  ],
  "columnClues": [
    3,
    4,
    1,
    4,
    2,
    5,
    2
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 4,
      "y": 4
    },
    {
      "x": 6,
      "y": 4
    },
    {
      "x": 3,
      "y": 5
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
    ".###...",
    ".....#.",
    ".#.#.#.",
    ".......",
    "##.#.#.",
    "##..###",
    "#..####"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2414691385,
  "sourceCandidateId": "generated-monster-only-7-2414691385",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 42,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 42
};

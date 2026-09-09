import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-100",
  "width": 7,
  "height": 7,
  "rowClues": [
    6,
    5,
    3,
    3,
    3,
    3,
    1
  ],
  "columnClues": [
    5,
    4,
    0,
    5,
    4,
    2,
    4
  ],
  "monsters": [
    {
      "x": 2,
      "y": 0
    },
    {
      "x": 5,
      "y": 1
    },
    {
      "x": 1,
      "y": 2
    },
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 0,
      "y": 4
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
    "##.####",
    "##.##.#",
    "#..##..",
    "##....#",
    "...##.#",
    "##.#...",
    ".....#."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1709174324,
  "sourceCandidateId": "generated-monster-only-7-1709174324",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 43,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 40
};

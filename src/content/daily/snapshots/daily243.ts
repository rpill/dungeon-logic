import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-243",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    1,
    4,
    0,
    4,
    3,
    5
  ],
  "columnClues": [
    2,
    3,
    1,
    3,
    3,
    5,
    3
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 3,
      "y": 0
    },
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 4,
      "y": 4
    },
    {
      "x": 3,
      "y": 5
    },
    {
      "x": 0,
      "y": 6
    },
    {
      "x": 2,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "..#.##.",
    "#......",
    "##.#.#.",
    ".......",
    ".#.#.##",
    "....###",
    ".#.####"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2577947435,
  "sourceCandidateId": "generated-monster-only-7-2577947435",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 43,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 42
};

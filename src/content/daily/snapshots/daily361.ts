import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-361",
  "width": 7,
  "height": 7,
  "rowClues": [
    0,
    4,
    1,
    3,
    3,
    3,
    6
  ],
  "columnClues": [
    4,
    1,
    3,
    1,
    4,
    3,
    4
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
      "y": 2
    },
    {
      "x": 6,
      "y": 3
    },
    {
      "x": 5,
      "y": 4
    },
    {
      "x": 0,
      "y": 5
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
    ".......",
    "#.#.#.#",
    "..#....",
    "#...##.",
    "#.#...#",
    "....###",
    "##.####"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 451121582,
  "sourceCandidateId": "generated-monster-only-7-451121582",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 31,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 31
};

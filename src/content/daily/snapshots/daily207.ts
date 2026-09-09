import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-207",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    4,
    5,
    2,
    2,
    2,
    2
  ],
  "columnClues": [
    3,
    1,
    4,
    2,
    5,
    1,
    5
  ],
  "monsters": [
    {
      "x": 3,
      "y": 0
    },
    {
      "x": 0,
      "y": 1
    },
    {
      "x": 5,
      "y": 1
    },
    {
      "x": 0,
      "y": 3
    },
    {
      "x": 6,
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
    "#...###",
    "..###.#",
    "#.###.#",
    "....#.#",
    "#.#....",
    "....#.#",
    ".##...."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3879451670,
  "sourceCandidateId": "generated-monster-only-7-3879451670",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 57,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 54
};

import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-226",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    5,
    3,
    1,
    3,
    4,
    2
  ],
  "columnClues": [
    3,
    2,
    1,
    4,
    6,
    4,
    3
  ],
  "monsters": [
    {
      "x": 1,
      "y": 0
    },
    {
      "x": 3,
      "y": 1
    },
    {
      "x": 5,
      "y": 2
    },
    {
      "x": 5,
      "y": 5
    },
    {
      "x": 0,
      "y": 6
    },
    {
      "x": 3,
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
    "#..####",
    "##..###",
    "...##.#",
    ".#.....",
    "...###.",
    "#.###..",
    "....##."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 4267602573,
  "sourceCandidateId": "generated-monster-only-7-4267602573",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 57,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 54
};

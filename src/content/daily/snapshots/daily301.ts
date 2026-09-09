import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-301",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    2,
    3,
    5,
    1,
    4,
    1
  ],
  "columnClues": [
    0,
    3,
    3,
    2,
    2,
    4,
    6
  ],
  "monsters": [
    {
      "x": 1,
      "y": 0
    },
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 6,
      "y": 1
    },
    {
      "x": 5,
      "y": 4
    },
    {
      "x": 5,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "..##.##",
    ".##....",
    "....###",
    ".##.###",
    "......#",
    ".#.#.##",
    "......#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 25859011,
  "sourceCandidateId": "generated-monster-only-7-25859011",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 48
};

import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-214",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    4,
    4,
    0,
    4,
    0,
    4
  ],
  "columnClues": [
    1,
    4,
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
      "x": 0,
      "y": 2
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
      "x": 6,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "...####",
    "##...##",
    ".#.#.##",
    ".......",
    ".##.##.",
    ".......",
    ".#.###."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1593549797,
  "sourceCandidateId": "generated-monster-only-7-1593549797",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 43,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 40
};

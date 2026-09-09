import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-288",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    4,
    3,
    1,
    3,
    2,
    4
  ],
  "columnClues": [
    1,
    4,
    2,
    2,
    4,
    5,
    3
  ],
  "monsters": [
    {
      "x": 2,
      "y": 0
    },
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 0,
      "y": 1
    },
    {
      "x": 1,
      "y": 2
    },
    {
      "x": 5,
      "y": 5
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "##..##.",
    ".##.##.",
    "..#.##.",
    ".#.....",
    "...#.##",
    ".#....#",
    "...####"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2341633746,
  "sourceCandidateId": "generated-monster-only-7-2341633746",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 34
};

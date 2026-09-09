import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-081",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    5,
    5,
    3,
    3,
    1,
    4
  ],
  "columnClues": [
    2,
    1,
    3,
    3,
    3,
    6,
    5
  ],
  "monsters": [
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 2,
      "y": 1
    },
    {
      "x": 4,
      "y": 3
    },
    {
      "x": 0,
      "y": 4
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
      "x": 4,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    ".....##",
    ".#.####",
    "..#####",
    "#....##",
    "..#.##.",
    "#......",
    "..##.##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 4261751639,
  "sourceCandidateId": "generated-monster-only-7-4261751639",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 42,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 40
};

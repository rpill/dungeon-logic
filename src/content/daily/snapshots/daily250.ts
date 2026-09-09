import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-250",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    1,
    3,
    2,
    6,
    5,
    4
  ],
  "columnClues": [
    4,
    3,
    3,
    1,
    3,
    6,
    4
  ],
  "monsters": [
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 4,
      "y": 3
    },
    {
      "x": 6,
      "y": 3
    },
    {
      "x": 4,
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
    "...#.##",
    ".#.....",
    "..#.##.",
    "#....#.",
    "###.###",
    "###..##",
    "#...###"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 815454692,
  "sourceCandidateId": "generated-monster-only-7-815454692",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 34
};

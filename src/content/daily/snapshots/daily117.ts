import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-117",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    3,
    1,
    2,
    3,
    4,
    5
  ],
  "columnClues": [
    1,
    3,
    3,
    2,
    2,
    5,
    4
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 1,
      "y": 5
    },
    {
      "x": 0,
      "y": 6
    },
    {
      "x": 3,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    ".....##",
    "#.##...",
    ".....#.",
    ".#.#...",
    ".#...##",
    "..#.###",
    ".##.###"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 210412820,
  "sourceCandidateId": "generated-monster-only-7-210412820",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 33,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 34
};

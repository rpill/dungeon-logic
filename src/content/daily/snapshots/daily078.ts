import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-078",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    3,
    1,
    3,
    1,
    5,
    5
  ],
  "columnClues": [
    2,
    1,
    5,
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
      "x": 0,
      "y": 2
    },
    {
      "x": 3,
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
    "..#...#",
    "#...#.#",
    "..#....",
    "#...##.",
    "..#....",
    ".##.###",
    "..#####"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2157205004,
  "sourceCandidateId": "generated-monster-only-7-2157205004",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 66,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 66
};

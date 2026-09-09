import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-306",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    5,
    2,
    5,
    0,
    4,
    3
  ],
  "columnClues": [
    4,
    2,
    3,
    2,
    2,
    4,
    6
  ],
  "monsters": [
    {
      "x": 5,
      "y": 0
    },
    {
      "x": 1,
      "y": 1
    },
    {
      "x": 5,
      "y": 2
    },
    {
      "x": 6,
      "y": 4
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
    "###...#",
    "#.#.###",
    "#.....#",
    "#.#.###",
    ".......",
    ".#.#.##",
    "...#.##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2734175026,
  "sourceCandidateId": "generated-monster-only-7-2734175026",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 62,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 66
};

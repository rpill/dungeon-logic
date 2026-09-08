import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-041",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    3,
    3,
    3,
    3,
    2,
    3
  ],
  "columnClues": [
    6,
    3,
    4,
    0,
    3,
    1,
    3
  ],
  "monsters": [
    {
      "x": 1,
      "y": 1
    },
    {
      "x": 0,
      "y": 5
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
    "###....",
    "#...##.",
    "###....",
    "#...#.#",
    "#.#...#",
    "....#.#",
    "###...."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1178773961,
  "sourceCandidateId": "generated-monster-only-7-1178773961",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 59,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 60
};

import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-241",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    4,
    2,
    2,
    2,
    3,
    4
  ],
  "columnClues": [
    6,
    3,
    4,
    0,
    4,
    3,
    2
  ],
  "monsters": [
    {
      "x": 3,
      "y": 0
    },
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 2,
      "y": 1
    },
    {
      "x": 1,
      "y": 2
    },
    {
      "x": 0,
      "y": 3
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "###.##.",
    "##..##.",
    "#.#....",
    "....##.",
    "#.#....",
    "#...#.#",
    "###...#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3262439490,
  "sourceCandidateId": "generated-monster-only-7-3262439490",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 36
};

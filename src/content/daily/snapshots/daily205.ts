import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-205",
  "width": 7,
  "height": 7,
  "rowClues": [
    6,
    4,
    4,
    2,
    2,
    2,
    2
  ],
  "columnClues": [
    5,
    3,
    4,
    0,
    4,
    2,
    4
  ],
  "monsters": [
    {
      "x": 3,
      "y": 0
    },
    {
      "x": 2,
      "y": 2
    },
    {
      "x": 1,
      "y": 3
    },
    {
      "x": 0,
      "y": 4
    },
    {
      "x": 0,
      "y": 6
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
    "###.###",
    "###...#",
    "##..#.#",
    "#.#....",
    "....##.",
    "#.#....",
    "....#.#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1060147342,
  "sourceCandidateId": "generated-monster-only-7-1060147342",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 48
};

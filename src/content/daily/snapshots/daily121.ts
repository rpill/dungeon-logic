import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-121",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    4,
    4,
    2,
    2,
    2,
    2
  ],
  "columnClues": [
    5,
    2,
    4,
    0,
    4,
    1,
    4
  ],
  "monsters": [
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
    "###...#",
    "##..#.#",
    "#.#.#.#",
    "#.#....",
    "....##.",
    "#.#....",
    "....#.#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 4261898734,
  "sourceCandidateId": "generated-monster-only-7-4261898734",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 46
};

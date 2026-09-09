import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-091",
  "width": 7,
  "height": 7,
  "rowClues": [
    6,
    3,
    4,
    0,
    5,
    4,
    4
  ],
  "columnClues": [
    6,
    4,
    2,
    2,
    3,
    4,
    5
  ],
  "monsters": [
    {
      "x": 2,
      "y": 0
    },
    {
      "x": 1,
      "y": 1
    },
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 0,
      "y": 3
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
    "##.####",
    "#....##",
    "##.#.#.",
    ".......",
    "###.#.#",
    "###...#",
    "#...###"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 485662558,
  "sourceCandidateId": "generated-monster-only-7-485662558",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 43,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 42
};

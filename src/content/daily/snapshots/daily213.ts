import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-213",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    4,
    0,
    4,
    2,
    4,
    5
  ],
  "columnClues": [
    5,
    2,
    2,
    1,
    4,
    3,
    5
  ],
  "monsters": [
    {
      "x": 1,
      "y": 0
    },
    {
      "x": 6,
      "y": 1
    },
    {
      "x": 0,
      "y": 2
    },
    {
      "x": 0,
      "y": 4
    },
    {
      "x": 1,
      "y": 5
    },
    {
      "x": 5,
      "y": 5
    },
    {
      "x": 2,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "#....##",
    "##.#.#.",
    ".......",
    "#.#.#.#",
    "....#.#",
    "#.#.#.#",
    "##..###"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1694509701,
  "sourceCandidateId": "generated-monster-only-7-1694509701",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 34
};

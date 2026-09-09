import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-328",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    4,
    3,
    1,
    4,
    4,
    3
  ],
  "columnClues": [
    6,
    4,
    4,
    2,
    2,
    2,
    2
  ],
  "monsters": [
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 1,
      "y": 1
    },
    {
      "x": 0,
      "y": 2
    },
    {
      "x": 2,
      "y": 5
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
    "###....",
    "#.#.#.#",
    "..#.#.#",
    "#......",
    "##.#.#.",
    "##.#.#.",
    "###...."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1527425059,
  "sourceCandidateId": "generated-monster-only-7-1527425059",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 32
};

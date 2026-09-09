import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-169",
  "width": 7,
  "height": 7,
  "rowClues": [
    1,
    4,
    3,
    3,
    3,
    3,
    4
  ],
  "columnClues": [
    4,
    1,
    3,
    0,
    4,
    4,
    5
  ],
  "monsters": [
    {
      "x": 6,
      "y": 1
    },
    {
      "x": 5,
      "y": 3
    },
    {
      "x": 5,
      "y": 5
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "#......",
    "#.#.##.",
    "....###",
    ".##...#",
    "....###",
    "#.#...#",
    "#...###"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1953895081,
  "sourceCandidateId": "generated-monster-only-7-1953895081",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 57,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 54
};

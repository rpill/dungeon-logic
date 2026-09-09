import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-084",
  "width": 7,
  "height": 7,
  "rowClues": [
    1,
    4,
    1,
    5,
    2,
    5,
    3
  ],
  "columnClues": [
    6,
    4,
    4,
    2,
    1,
    2,
    2
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 2,
      "y": 4
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
    "......#",
    "#.#.#.#",
    "#......",
    "####.#.",
    "##.....",
    "####.#.",
    "###...."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 872403770,
  "sourceCandidateId": "generated-monster-only-7-872403770",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 56,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 52
};

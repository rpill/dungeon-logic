import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-313",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    1,
    5,
    2,
    4,
    2,
    4
  ],
  "columnClues": [
    6,
    5,
    3,
    2,
    2,
    2,
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
      "x": 0,
      "y": 1
    },
    {
      "x": 1,
      "y": 5
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "###.#..",
    "......#",
    "###.#.#",
    "##.....",
    "##.#.#.",
    "#....#.",
    "####..."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3555826445,
  "sourceCandidateId": "generated-monster-only-7-3555826445",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 57,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 58
};

import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-132",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    5,
    3,
    4,
    1,
    2,
    2
  ],
  "columnClues": [
    5,
    5,
    1,
    4,
    2,
    1,
    3
  ],
  "monsters": [
    {
      "x": 4,
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
      "y": 3
    },
    {
      "x": 0,
      "y": 4
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "####...",
    "##.##.#",
    "##....#",
    "#..##.#",
    ".#.....",
    "...#.#.",
    "##....."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 974027263,
  "sourceCandidateId": "generated-monster-only-7-974027263",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 56,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 54
};

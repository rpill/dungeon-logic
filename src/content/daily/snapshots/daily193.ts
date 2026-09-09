import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-193",
  "width": 7,
  "height": 7,
  "rowClues": [
    6,
    4,
    3,
    1,
    3,
    2,
    3
  ],
  "columnClues": [
    2,
    4,
    3,
    2,
    2,
    4,
    5
  ],
  "monsters": [
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 6,
      "y": 3
    },
    {
      "x": 1,
      "y": 4
    },
    {
      "x": 6,
      "y": 5
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "####.##",
    "##...##",
    "...#.##",
    ".#.....",
    "..#.#.#",
    ".##....",
    "....###"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3766918225,
  "sourceCandidateId": "generated-monster-only-7-3766918225",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 34
};

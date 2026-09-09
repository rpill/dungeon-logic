import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-267",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    4,
    3,
    5,
    2,
    3,
    1
  ],
  "columnClues": [
    5,
    6,
    3,
    1,
    3,
    0,
    4
  ],
  "monsters": [
    {
      "x": 2,
      "y": 1
    },
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 6,
      "y": 4
    },
    {
      "x": 0,
      "y": 6
    },
    {
      "x": 6,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "###...#",
    "##..#.#",
    "###....",
    "###.#.#",
    "##.....",
    "...##.#",
    ".#....."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3127905546,
  "sourceCandidateId": "generated-monster-only-7-3127905546",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 62,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 66
};

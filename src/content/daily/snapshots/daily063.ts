import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-063",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    1,
    4,
    3,
    2,
    5,
    5
  ],
  "columnClues": [
    3,
    5,
    4,
    1,
    3,
    2,
    4
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
      "x": 0,
      "y": 3
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
      "x": 5,
      "y": 5
    },
    {
      "x": 4,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "...#.#.",
    ".#.....",
    ".##.#.#",
    ".##.#..",
    "#.....#",
    "###.#.#",
    "###..##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2938696217,
  "sourceCandidateId": "generated-monster-only-7-2938696217",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 42,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 40
};

import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-201",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    2,
    2,
    3,
    2,
    5,
    3
  ],
  "columnClues": [
    4,
    5,
    2,
    2,
    1,
    3,
    3
  ],
  "monsters": [
    {
      "x": 1,
      "y": 0
    },
    {
      "x": 0,
      "y": 1
    },
    {
      "x": 6,
      "y": 1
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
      "x": 6,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "#....##",
    ".#.#...",
    ".....##",
    ".#.#.#.",
    "##.....",
    "###.#.#",
    "###...."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2876932809,
  "sourceCandidateId": "generated-monster-only-7-2876932809",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 65,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 64
};

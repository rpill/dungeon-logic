import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-252",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    2,
    2,
    3,
    2,
    6,
    6
  ],
  "columnClues": [
    4,
    3,
    5,
    0,
    4,
    3,
    4
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 0,
      "y": 3
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
    ".##....",
    "....##.",
    "#.#....",
    "..#.#.#",
    "#.....#",
    "###.###",
    "###.###"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1950422843,
  "sourceCandidateId": "generated-monster-only-7-1950422843",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 43,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 40
};

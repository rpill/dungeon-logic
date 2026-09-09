import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-319",
  "width": 7,
  "height": 7,
  "rowClues": [
    1,
    5,
    1,
    2,
    2,
    5,
    5
  ],
  "columnClues": [
    5,
    5,
    3,
    2,
    1,
    3,
    2
  ],
  "monsters": [
    {
      "x": 1,
      "y": 0
    },
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 0,
      "y": 2
    },
    {
      "x": 6,
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
    "#......",
    "###.#.#",
    ".#.....",
    "...#.#.",
    "##.....",
    "####.#.",
    "###..##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1043516818,
  "sourceCandidateId": "generated-monster-only-7-1043516818",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 59,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 59
};

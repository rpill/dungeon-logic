import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-073",
  "width": 7,
  "height": 7,
  "rowClues": [
    6,
    3,
    2,
    3,
    2,
    3,
    4
  ],
  "columnClues": [
    5,
    5,
    2,
    4,
    3,
    3,
    1
  ],
  "monsters": [
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 2,
      "y": 1
    },
    {
      "x": 0,
      "y": 2
    },
    {
      "x": 0,
      "y": 4
    },
    {
      "x": 3,
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
    "######.",
    "##.#...",
    "...#.#.",
    "##...#.",
    "...##..",
    "##....#",
    "###.#.."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2713070456,
  "sourceCandidateId": "generated-monster-only-7-2713070456",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 45,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 48
};

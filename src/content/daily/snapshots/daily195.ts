import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-195",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    3,
    2,
    4,
    3,
    2,
    3
  ],
  "columnClues": [
    6,
    3,
    1,
    3,
    0,
    5,
    3
  ],
  "monsters": [
    {
      "x": 1,
      "y": 1
    },
    {
      "x": 6,
      "y": 1
    },
    {
      "x": 6,
      "y": 3
    },
    {
      "x": 0,
      "y": 5
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
    "##...##",
    "#..#.#.",
    "##.....",
    "##.#.#.",
    "#....##",
    "..##...",
    "#....##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 74213373,
  "sourceCandidateId": "generated-monster-only-7-74213373",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 43,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 40
};

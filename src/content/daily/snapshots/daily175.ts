import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-175",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    2,
    3,
    1,
    5,
    6,
    3
  ],
  "columnClues": [
    4,
    4,
    4,
    2,
    2,
    4,
    2
  ],
  "monsters": [
    {
      "x": 2,
      "y": 0
    },
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 3,
      "y": 1
    },
    {
      "x": 6,
      "y": 4
    },
    {
      "x": 2,
      "y": 6
    },
    {
      "x": 5,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "...#.#.",
    ".##....",
    "..##.#.",
    "#......",
    "###.##.",
    "###.###",
    "##....#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2205706461,
  "sourceCandidateId": "generated-monster-only-7-2205706461",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 43,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 40
};

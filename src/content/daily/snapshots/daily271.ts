import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-271",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    5,
    2,
    2,
    4,
    3,
    4
  ],
  "columnClues": [
    6,
    5,
    4,
    2,
    2,
    2,
    2
  ],
  "monsters": [
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 0,
      "y": 2
    },
    {
      "x": 1,
      "y": 3
    },
    {
      "x": 2,
      "y": 4
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "###....",
    "###.#.#",
    "....#.#",
    "#.#....",
    "##.#.#.",
    "##...#.",
    "####..."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1013854311,
  "sourceCandidateId": "generated-monster-only-7-1013854311",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 40
};

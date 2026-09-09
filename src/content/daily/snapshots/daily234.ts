import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-234",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    5,
    2,
    3,
    2,
    3,
    2
  ],
  "columnClues": [
    6,
    4,
    2,
    2,
    2,
    2,
    3
  ],
  "monsters": [
    {
      "x": 0,
      "y": 2
    },
    {
      "x": 1,
      "y": 4
    },
    {
      "x": 1,
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
    "###.#.#",
    "....#.#",
    "##.#...",
    "#....#.",
    "##.#...",
    "#....#."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3420472660,
  "sourceCandidateId": "generated-monster-only-7-3420472660",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 46
};

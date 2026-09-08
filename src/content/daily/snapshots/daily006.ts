import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-006",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    4,
    2,
    2,
    2,
    3,
    6
  ],
  "columnClues": [
    4,
    3,
    4,
    0,
    4,
    3,
    3
  ],
  "monsters": [
    {
      "x": 2,
      "y": 0
    },
    {
      "x": 1,
      "y": 1
    },
    {
      "x": 6,
      "y": 4
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
    "##.....",
    "#.#.##.",
    "#.#....",
    "....#.#",
    ".##....",
    "....###",
    "###.###"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3696005191,
  "sourceCandidateId": "generated-monster-only-7-3696005191",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 44
};

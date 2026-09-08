import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-011",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    2,
    2,
    4,
    0,
    4,
    4
  ],
  "columnClues": [
    4,
    2,
    5,
    0,
    4,
    2,
    3
  ],
  "monsters": [
    {
      "x": 1,
      "y": 0
    },
    {
      "x": 3,
      "y": 0
    },
    {
      "x": 5,
      "y": 0
    },
    {
      "x": 1,
      "y": 5
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "#.#.#.#",
    "#.#....",
    "....##.",
    ".##.##.",
    ".......",
    "#.#.#.#",
    "###...#"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-monster-only-7-4082243152",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction"
};

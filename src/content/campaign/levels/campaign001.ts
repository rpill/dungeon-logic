import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-001",
  "width": 6,
  "height": 6,
  "rowClues": [
    5,
    4,
    1,
    2,
    3,
    0
  ],
  "columnClues": [
    4,
    2,
    2,
    2,
    3,
    2
  ],
  "monsters": [
    {
      "x": 2,
      "y": 0
    },
    {
      "x": 4,
      "y": 1
    },
    {
      "x": 0,
      "y": 3
    },
    {
      "x": 0,
      "y": 5
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "##.###",
    "##.#.#",
    "#.....",
    "..#.#.",
    "#.#.#.",
    "......"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 123456,
  "sourceCandidateId": "generated-monster-only-6-2398889868",
  "sourceArchetype": "monster-only",
  "difficulty": "easy",
  "difficultyScore": 4,
  "humanStatus": "solved-direct"
};

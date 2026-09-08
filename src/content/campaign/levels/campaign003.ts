import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-003",
  "width": 6,
  "height": 6,
  "rowClues": [
    5,
    3,
    3,
    2,
    1,
    2
  ],
  "columnClues": [
    0,
    3,
    1,
    5,
    2,
    5
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 4,
      "y": 2
    },
    {
      "x": 5,
      "y": 4
    },
    {
      "x": 4,
      "y": 5
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    ".#####",
    "...###",
    ".#.#.#",
    "...#.#",
    ".#....",
    "...#.#"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 654321,
  "sourceCandidateId": "generated-monster-only-6-2057422507",
  "sourceArchetype": "monster-only",
  "difficulty": "easy",
  "difficultyScore": 6,
  "humanStatus": "solved-direct"
};

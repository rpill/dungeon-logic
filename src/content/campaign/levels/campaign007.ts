import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-007",
  "width": 7,
  "height": 7,
  "rowClues": [
    6,
    3,
    2,
    3,
    0,
    4,
    3
  ],
  "columnClues": [
    3,
    3,
    1,
    3,
    3,
    4,
    4
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
      "x": 0,
      "y": 2
    },
    {
      "x": 5,
      "y": 5
    },
    {
      "x": 0,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "##.####",
    "#....##",
    ".#.#...",
    ".#.#.#.",
    ".......",
    "#.#.#.#",
    "....###"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-monster-only-7-108316283",
  "sourceArchetype": "monster-only",
  "difficulty": "easy",
  "difficultyScore": 15,
  "humanStatus": "solved-direct"
};

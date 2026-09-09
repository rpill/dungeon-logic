import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-036",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    4,
    5,
    0,
    4,
    1,
    6
  ],
  "columnClues": [
    3,
    3,
    3,
    2,
    4,
    5,
    3
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 4,
      "y": 1
    },
    {
      "x": 0,
      "y": 5
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
    "....###",
    "#.#..##",
    "#.#.###",
    ".......",
    ".#.###.",
    ".#.....",
    "######."
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-monster-only-7-2296793786",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 59,
  "humanStatus": "solved-with-contradiction"
};

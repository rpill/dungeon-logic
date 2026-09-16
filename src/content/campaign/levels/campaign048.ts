import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-048",
  "width": 8,
  "height": 8,
  "rowClues": [
    6,
    4,
    4,
    3,
    5,
    0,
    4,
    2
  ],
  "columnClues": [
    5,
    5,
    2,
    3,
    2,
    4,
    4,
    3
  ],
  "monsters": [
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 0,
      "y": 1
    },
    {
      "x": 1,
      "y": 3
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
    "###..###",
    "....####",
    "###....#",
    "#..#.#..",
    "##.#.##.",
    "........",
    ".#.##.#.",
    "##......"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 3981045200,
  "sourceCandidateId": "generated-monster-only-8-3981045200",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 70,
  "humanStatus": "solved-with-contradiction"
};

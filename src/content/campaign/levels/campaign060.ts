import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-060",
  "width": 7,
  "height": 7,
  "rowClues": [
    6,
    3,
    3,
    2,
    3,
    0,
    4
  ],
  "columnClues": [
    2,
    5,
    0,
    4,
    1,
    5,
    4
  ],
  "monsters": [
    {
      "x": 2,
      "y": 0
    },
    {
      "x": 5,
      "y": 1
    },
    {
      "x": 6,
      "y": 3
    },
    {
      "x": 0,
      "y": 6
    },
    {
      "x": 2,
      "y": 6
    },
    {
      "x": 4,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "##.####",
    "##....#",
    "...#.##",
    ".#...#.",
    ".#.#.#.",
    ".......",
    ".#.#.##"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-monster-only-7-2639840852",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 31,
  "humanStatus": "solved-with-contradiction"
};

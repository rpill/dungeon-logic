import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-055",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    2,
    3,
    0,
    4,
    3,
    6
  ],
  "columnClues": [
    3,
    3,
    3,
    3,
    1,
    3,
    4
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 2,
      "y": 0
    },
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 1,
      "y": 5
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
    ".#.#...",
    ".....##",
    ".#.#.#.",
    ".......",
    "#.#.#.#",
    "#.#...#",
    "####.##"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-monster-only-7-2010294335",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction"
};

import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-062",
  "width": 8,
  "height": 8,
  "rowClues": [
    2,
    6,
    2,
    4,
    4,
    3,
    1,
    4
  ],
  "columnClues": [
    1,
    3,
    5,
    0,
    5,
    2,
    5,
    5
  ],
  "monsters": [
    {
      "x": 5,
      "y": 0
    },
    {
      "x": 6,
      "y": 3
    },
    {
      "x": 7,
      "y": 4
    },
    {
      "x": 0,
      "y": 7
    },
    {
      "x": 3,
      "y": 7
    },
    {
      "x": 6,
      "y": 7
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "......##",
    ".##.####",
    "......##",
    ".##.#..#",
    ".##.#.#.",
    "..#.#.#.",
    "#.......",
    "..#.##.#"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 729661136,
  "sourceCandidateId": "generated-monster-only-8-729661136",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 72,
  "humanStatus": "solved-with-contradiction"
};

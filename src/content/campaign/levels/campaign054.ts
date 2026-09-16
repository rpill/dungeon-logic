import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-054",
  "width": 8,
  "height": 8,
  "rowClues": [
    0,
    4,
    2,
    4,
    2,
    5,
    4,
    6
  ],
  "columnClues": [
    1,
    6,
    2,
    3,
    1,
    3,
    5,
    6
  ],
  "monsters": [
    {
      "x": 7,
      "y": 1
    },
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 6,
      "y": 4
    },
    {
      "x": 0,
      "y": 6
    },
    {
      "x": 5,
      "y": 7
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "........",
    ".##.#.#.",
    ".#.....#",
    "...#.###",
    ".#.....#",
    ".#.#.###",
    ".#...###",
    "####..##"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 2658359639,
  "sourceCandidateId": "generated-monster-only-8-2658359639",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 71,
  "humanStatus": "solved-with-contradiction"
};

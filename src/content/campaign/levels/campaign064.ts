import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-064",
  "width": 8,
  "height": 8,
  "rowClues": [
    3,
    2,
    3,
    2,
    2,
    5,
    5,
    7
  ],
  "columnClues": [
    4,
    2,
    3,
    2,
    4,
    5,
    3,
    6
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 5,
      "y": 0
    },
    {
      "x": 7,
      "y": 1
    },
    {
      "x": 7,
      "y": 3
    },
    {
      "x": 6,
      "y": 5
    },
    {
      "x": 3,
      "y": 7
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "....#.##",
    "#.#.....",
    "...#.#.#",
    ".#.#....",
    ".....#.#",
    "#.#.##.#",
    "#...####",
    "###.####"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 2666001420,
  "sourceCandidateId": "generated-monster-only-8-2666001420",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 72,
  "humanStatus": "solved-with-contradiction"
};

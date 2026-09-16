import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-042",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    2,
    4,
    1,
    2,
    5,
    4
  ],
  "columnClues": [
    1,
    3,
    2,
    5,
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
      "x": 2,
      "y": 0
    },
    {
      "x": 4,
      "y": 1
    },
    {
      "x": 5,
      "y": 2
    },
    {
      "x": 4,
      "y": 4
    },
    {
      "x": 0,
      "y": 6
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
    ".#.####",
    ".....##",
    ".#.##.#",
    ".#.....",
    "...#.#.",
    "#.####.",
    "..####."
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 3486636806,
  "sourceCandidateId": "generated-monster-only-7-3486636806",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 65,
  "humanStatus": "solved-with-contradiction"
};

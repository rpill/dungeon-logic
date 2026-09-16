import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-052",
  "width": 8,
  "height": 8,
  "rowClues": [
    3,
    5,
    1,
    5,
    0,
    4,
    3,
    5
  ],
  "columnClues": [
    5,
    3,
    3,
    2,
    2,
    4,
    6,
    1
  ],
  "monsters": [
    {
      "x": 5,
      "y": 0
    },
    {
      "x": 7,
      "y": 0
    },
    {
      "x": 5,
      "y": 5
    },
    {
      "x": 7,
      "y": 6
    },
    {
      "x": 1,
      "y": 7
    },
    {
      "x": 4,
      "y": 7
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "##....#.",
    "##.#.##.",
    "#.......",
    "#.##.##.",
    "........",
    ".##.#.#.",
    "....###.",
    "#.#..###"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 1151578360,
  "sourceCandidateId": "generated-monster-only-8-1151578360",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 70,
  "humanStatus": "solved-with-contradiction"
};

import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-029",
  "width": 8,
  "height": 8,
  "rowClues": [
    1,
    4,
    1,
    6,
    2,
    5,
    1,
    6
  ],
  "columnClues": [
    7,
    4,
    4,
    3,
    1,
    3,
    3,
    1
  ],
  "monsters": [
    {
      "x": 0,
      "y": 1
    },
    {
      "x": 2,
      "y": 4
    },
    {
      "x": 1,
      "y": 6
    },
    {
      "x": 4,
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
    "#.......",
    "..##.##.",
    "#.......",
    "####.##.",
    "##......",
    "###.#.#.",
    "#.......",
    "####.#.#"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 812836217,
  "sourceCandidateId": "generated-monster-only-8-812836217",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 57,
  "humanStatus": "solved-with-contradiction"
};

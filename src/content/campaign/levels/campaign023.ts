import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-023",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    3,
    5,
    2,
    3,
    2,
    3
  ],
  "columnClues": [
    6,
    4,
    2,
    2,
    2,
    5,
    2
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
      "x": 6,
      "y": 2
    },
    {
      "x": 1,
      "y": 3
    },
    {
      "x": 1,
      "y": 5
    },
    {
      "x": 2,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "###..##",
    "....###",
    "###.##.",
    "#....#.",
    "##.#...",
    "#....#.",
    "##.#..."
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-monster-only-7-3998501993",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 57,
  "humanStatus": "solved-with-contradiction"
};

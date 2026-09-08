import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-008",
  "width": 7,
  "height": 7,
  "rowClues": [
    1,
    3,
    4,
    2,
    5,
    4,
    5
  ],
  "columnClues": [
    5,
    5,
    0,
    5,
    1,
    3,
    5
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 0,
      "y": 3
    },
    {
      "x": 5,
      "y": 3
    },
    {
      "x": 2,
      "y": 6
    },
    {
      "x": 5,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    ".....#.",
    "##.#...",
    "##...##",
    "...#..#",
    "##.#.##",
    "##.#..#",
    "##.##.#"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-monster-only-7-3789115606",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 30,
  "humanStatus": "solved-with-contradiction"
};

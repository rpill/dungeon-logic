import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-022",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    0,
    4,
    0,
    5,
    3,
    6
  ],
  "columnClues": [
    3,
    3,
    3,
    2,
    2,
    4,
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
      "x": 4,
      "y": 0
    },
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 6,
      "y": 3
    },
    {
      "x": 3,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    ".#.#.#.",
    ".......",
    ".##.#.#",
    ".......",
    "#.##.##",
    "#....##",
    "###.###"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 714097016,
  "sourceCandidateId": "generated-monster-only-7-714097016",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 43,
  "humanStatus": "solved-with-contradiction"
};

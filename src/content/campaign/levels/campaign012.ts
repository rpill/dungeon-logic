import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-012",
  "width": 7,
  "height": 7,
  "rowClues": [
    6,
    3,
    4,
    0,
    5,
    1,
    4
  ],
  "columnClues": [
    2,
    2,
    3,
    4,
    3,
    4,
    5
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 4,
      "y": 1
    },
    {
      "x": 6,
      "y": 3
    },
    {
      "x": 6,
      "y": 5
    },
    {
      "x": 0,
      "y": 6
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
    ".######",
    "...#.##",
    ".#.#.##",
    ".......",
    "#.###.#",
    "#......",
    "..#.###"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-monster-only-7-4161707177",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 43,
  "humanStatus": "solved-with-contradiction"
};

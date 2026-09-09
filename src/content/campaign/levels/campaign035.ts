import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-035",
  "width": 7,
  "height": 7,
  "rowClues": [
    1,
    3,
    1,
    4,
    5,
    3,
    4
  ],
  "columnClues": [
    5,
    2,
    3,
    1,
    3,
    5,
    2
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
      "y": 2
    },
    {
      "x": 1,
      "y": 3
    },
    {
      "x": 6,
      "y": 4
    },
    {
      "x": 1,
      "y": 5
    },
    {
      "x": 5,
      "y": 5
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    ".....#.",
    "##.#...",
    ".....#.",
    "#.#.##.",
    "###.##.",
    "#.#...#",
    "#...###"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-monster-only-7-758427304",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 59,
  "humanStatus": "solved-with-contradiction"
};

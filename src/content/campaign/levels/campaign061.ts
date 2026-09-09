import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-061",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    0,
    4,
    2,
    3,
    6,
    5
  ],
  "columnClues": [
    4,
    3,
    5,
    3,
    2,
    2,
    5
  ],
  "monsters": [
    {
      "x": 1,
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
      "x": 1,
      "y": 4
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
    "#.##.#.",
    ".......",
    ".##.#.#",
    "....#.#",
    "#.#...#",
    "####.##",
    "####..#"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-monster-only-7-1915807245",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction"
};

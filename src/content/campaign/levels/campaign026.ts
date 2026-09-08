import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-026",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    3,
    2,
    5,
    0,
    4,
    2
  ],
  "columnClues": [
    4,
    2,
    3,
    1,
    2,
    3,
    5
  ],
  "monsters": [
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 6,
      "y": 4
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "###...#",
    "#...#.#",
    "#.#....",
    "#.#.###",
    ".......",
    ".#.#.##",
    ".....##"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-monster-only-7-118748130",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 62,
  "humanStatus": "solved-with-contradiction"
};

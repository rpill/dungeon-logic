import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-014",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    5,
    3,
    1,
    3,
    2,
    5
  ],
  "columnClues": [
    3,
    4,
    4,
    3,
    4,
    1,
    3
  ],
  "monsters": [
    {
      "x": 3,
      "y": 0
    },
    {
      "x": 1,
      "y": 1
    },
    {
      "x": 3,
      "y": 2
    },
    {
      "x": 6,
      "y": 4
    },
    {
      "x": 0,
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
    "###....",
    "#.####.",
    "#.#.#..",
    "......#",
    ".#.##..",
    ".#....#",
    ".####.#"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-monster-only-7-1660428563",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 56,
  "humanStatus": "solved-with-contradiction"
};

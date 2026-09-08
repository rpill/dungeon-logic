import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-009",
  "width": 7,
  "height": 7,
  "rowClues": [
    1,
    3,
    1,
    3,
    3,
    3,
    6
  ],
  "columnClues": [
    2,
    2,
    4,
    2,
    4,
    1,
    5
  ],
  "monsters": [
    {
      "x": 6,
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
      "x": 2,
      "y": 5
    },
    {
      "x": 5,
      "y": 5
    },
    {
      "x": 0,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "#......",
    "..#.#.#",
    "#......",
    "..#.#.#",
    ".##...#",
    "...##.#",
    ".######"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-monster-only-7-754018346",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction"
};

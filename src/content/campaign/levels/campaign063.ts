import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-063",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    3,
    1,
    4,
    2,
    4,
    4
  ],
  "columnClues": [
    6,
    4,
    2,
    3,
    1,
    2,
    2
  ],
  "monsters": [
    {
      "x": 0,
      "y": 1
    },
    {
      "x": 2,
      "y": 5
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "#.....#",
    "..#.#.#",
    "#......",
    "##.#.#.",
    "##.....",
    "##.#.#.",
    "####..."
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-monster-only-7-3859115476",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 57,
  "humanStatus": "solved-with-contradiction"
};

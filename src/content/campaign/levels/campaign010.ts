import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-010",
  "width": 6,
  "height": 6,
  "rowClues": [
    2,
    4,
    0,
    3,
    2,
    4
  ],
  "columnClues": [
    2,
    2,
    1,
    4,
    1,
    5
  ],
  "monsters": [
    {
      "x": 5,
      "y": 2
    },
    {
      "x": 4,
      "y": 4
    },
    {
      "x": 0,
      "y": 5
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
    "#....#",
    "#.##.#",
    "......",
    ".#.#.#",
    "...#.#",
    ".#.###"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 563526693,
  "sourceCandidateId": "generated-monster-only-6-563526693",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 28,
  "humanStatus": "solved-with-contradiction"
};

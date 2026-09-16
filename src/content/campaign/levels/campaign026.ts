import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-026",
  "width": 6,
  "height": 6,
  "rowClues": [
    5,
    3,
    4,
    1,
    2,
    1
  ],
  "columnClues": [
    3,
    5,
    1,
    3,
    1,
    3
  ],
  "monsters": [
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 0,
      "y": 3
    },
    {
      "x": 0,
      "y": 5
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "####.#",
    "##...#",
    "##.#.#",
    ".#....",
    "...##.",
    ".#...."
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 2778907876,
  "sourceCandidateId": "generated-monster-only-6-2778907876",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 54,
  "humanStatus": "solved-with-contradiction"
};

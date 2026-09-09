import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-051",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    5,
    2,
    2,
    1,
    3,
    6
  ],
  "columnClues": [
    3,
    1,
    3,
    3,
    3,
    5,
    4
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 4,
      "y": 5
    },
    {
      "x": 1,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "....###",
    "#.#.###",
    "#.#....",
    "...#.#.",
    ".#.....",
    "...#.##",
    "#.#####"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-monster-only-7-389771598",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 69,
  "humanStatus": "solved-with-contradiction"
};

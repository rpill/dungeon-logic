import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-050",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    1,
    4,
    3,
    2,
    3,
    5
  ],
  "columnClues": [
    2,
    2,
    2,
    3,
    4,
    4,
    3
  ],
  "monsters": [
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 5,
      "y": 2
    },
    {
      "x": 6,
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
    "...#.#.",
    ".#.....",
    ".#.##.#",
    "....###",
    "#.#....",
    "#...##.",
    "..#####"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-monster-only-7-1100635727",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 69,
  "humanStatus": "solved-with-contradiction"
};

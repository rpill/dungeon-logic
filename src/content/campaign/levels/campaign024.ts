import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-024",
  "width": 8,
  "height": 8,
  "rowClues": [
    3,
    4,
    5,
    0,
    5,
    5,
    2,
    7
  ],
  "columnClues": [
    4,
    3,
    4,
    2,
    3,
    4,
    5,
    6
  ],
  "monsters": [
    {
      "x": 1,
      "y": 0
    },
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 7,
      "y": 3
    },
    {
      "x": 5,
      "y": 4
    },
    {
      "x": 1,
      "y": 6
    },
    {
      "x": 7,
      "y": 6
    },
    {
      "x": 3,
      "y": 7
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "..##...#",
    ".#...###",
    ".#.#.###",
    "........",
    "#.#.#.##",
    "#...####",
    "#.#.....",
    "###.####"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 1893373883,
  "sourceCandidateId": "generated-monster-only-8-1893373883",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 47,
  "humanStatus": "solved-with-contradiction"
};

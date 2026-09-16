import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-009",
  "width": 8,
  "height": 8,
  "rowClues": [
    4,
    3,
    1,
    5,
    4,
    2,
    4,
    5
  ],
  "columnClues": [
    1,
    3,
    2,
    3,
    2,
    4,
    6,
    7
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 6,
      "y": 1
    },
    {
      "x": 7,
      "y": 2
    },
    {
      "x": 0,
      "y": 7
    },
    {
      "x": 2,
      "y": 7
    }
  ],
  "chests": [
    {
      "x": 4,
      "y": 6
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    ".#...###",
    "...#.#.#",
    ".#......",
    "...#####",
    ".##...##",
    "......##",
    "#.#...##",
    "...#####"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 1521868498,
  "sourceCandidateId": "generated-mixed-one-room-8-1521868498",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "easy",
  "difficultyScore": 20,
  "humanStatus": "solved-direct"
};

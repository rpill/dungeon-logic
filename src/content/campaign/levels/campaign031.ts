import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-031",
  "width": 8,
  "height": 8,
  "rowClues": [
    4,
    6,
    3,
    2,
    5,
    3,
    4,
    2
  ],
  "columnClues": [
    4,
    0,
    4,
    0,
    5,
    4,
    5,
    7
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 0,
      "y": 2
    },
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 7,
      "y": 3
    },
    {
      "x": 0,
      "y": 5
    },
    {
      "x": 0,
      "y": 7
    },
    {
      "x": 6,
      "y": 7
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "....####",
    "#.#.####",
    "....##.#",
    "#.#.....",
    "#...####",
    "..#...##",
    "#...#.##",
    "..#....#"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 4165599009,
  "sourceCandidateId": "generated-monster-only-8-4165599009",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 59,
  "humanStatus": "solved-with-contradiction"
};

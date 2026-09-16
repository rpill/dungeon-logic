import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-050",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    3,
    1,
    5,
    3,
    3,
    3
  ],
  "columnClues": [
    5,
    4,
    2,
    3,
    1,
    3,
    2
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 0,
      "y": 2
    },
    {
      "x": 2,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "..#..#.",
    "#.#.#..",
    "......#",
    "##.#.##",
    "##.#...",
    "##...#.",
    "##.#..."
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 1449551244,
  "sourceCandidateId": "generated-monster-only-7-1449551244",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 69,
  "humanStatus": "solved-with-contradiction"
};

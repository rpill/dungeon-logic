import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-040",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    2,
    5,
    2,
    2,
    2,
    3
  ],
  "columnClues": [
    5,
    4,
    2,
    2,
    2,
    2,
    4
  ],
  "monsters": [
    {
      "x": 3,
      "y": 0
    },
    {
      "x": 5,
      "y": 0
    },
    {
      "x": 1,
      "y": 1
    },
    {
      "x": 0,
      "y": 5
    },
    {
      "x": 6,
      "y": 5
    },
    {
      "x": 1,
      "y": 6
    },
    {
      "x": 5,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "###.#.#",
    "#.....#",
    "###.#.#",
    "##.....",
    "...#.#.",
    ".#...#.",
    "#..#..#"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-monster-only-7-2527896273",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 66,
  "humanStatus": "solved-with-contradiction"
};

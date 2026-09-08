import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-029",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    2,
    4,
    1,
    4,
    3,
    4
  ],
  "columnClues": [
    4,
    5,
    1,
    3,
    2,
    2,
    3
  ],
  "monsters": [
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 0,
      "y": 1
    },
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 0,
      "y": 3
    },
    {
      "x": 6,
      "y": 4
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "...##..",
    ".#....#",
    "###.#..",
    "......#",
    "##.#.#.",
    "##.#...",
    "##...##"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-monster-only-7-2131173993",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 66,
  "humanStatus": "solved-with-contradiction"
};

import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-056",
  "width": 8,
  "height": 8,
  "rowClues": [
    2,
    4,
    3,
    3,
    5,
    1,
    4,
    4
  ],
  "columnClues": [
    3,
    2,
    2,
    2,
    3,
    3,
    4,
    7
  ],
  "monsters": [
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 6,
      "y": 4
    },
    {
      "x": 7,
      "y": 5
    },
    {
      "x": 0,
      "y": 6
    },
    {
      "x": 5,
      "y": 7
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "...#...#",
    ".#...###",
    ".#.#...#",
    ".....###",
    "#.#.##.#",
    "#.......",
    "..#.#.##",
    "#...#.##"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 1763328717,
  "sourceCandidateId": "generated-monster-only-8-1763328717",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 72,
  "humanStatus": "solved-with-contradiction"
};

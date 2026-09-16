import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-027",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    2,
    3,
    3,
    1,
    4,
    5
  ],
  "columnClues": [
    4,
    0,
    4,
    1,
    5,
    5,
    4
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 5,
      "y": 1
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
      "x": 0,
      "y": 4
    },
    {
      "x": 1,
      "y": 6
    },
    {
      "x": 3,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "..#####",
    "#.....#",
    "..#.##.",
    "#...##.",
    "..#....",
    "#...###",
    "#.#.###"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 3635444329,
  "sourceCandidateId": "generated-monster-only-7-3635444329",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 55,
  "humanStatus": "solved-with-contradiction"
};

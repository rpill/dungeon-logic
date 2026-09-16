import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-034",
  "width": 8,
  "height": 8,
  "rowClues": [
    5,
    5,
    5,
    1,
    3,
    3,
    4,
    4
  ],
  "columnClues": [
    6,
    2,
    2,
    2,
    3,
    4,
    7,
    4
  ],
  "monsters": [
    {
      "x": 1,
      "y": 1
    },
    {
      "x": 7,
      "y": 2
    },
    {
      "x": 0,
      "y": 4
    },
    {
      "x": 7,
      "y": 5
    },
    {
      "x": 0,
      "y": 7
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "##...###",
    "#..#.###",
    "##.#.##.",
    "#.......",
    "..#.#.#.",
    "#...#.#.",
    "#.#...##",
    "....####"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 3918559999,
  "sourceCandidateId": "generated-monster-only-8-3918559999",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 60,
  "humanStatus": "solved-with-contradiction"
};

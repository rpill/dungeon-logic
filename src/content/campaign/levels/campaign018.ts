import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-018",
  "width": 8,
  "height": 8,
  "rowClues": [
    1,
    4,
    0,
    5,
    3,
    4,
    5,
    5
  ],
  "columnClues": [
    6,
    2,
    6,
    3,
    1,
    3,
    2,
    4
  ],
  "monsters": [
    {
      "x": 1,
      "y": 0
    },
    {
      "x": 0,
      "y": 1
    },
    {
      "x": 3,
      "y": 4
    },
    {
      "x": 7,
      "y": 4
    },
    {
      "x": 1,
      "y": 6
    },
    {
      "x": 6,
      "y": 6
    },
    {
      "x": 3,
      "y": 7
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
    "#.......",
    ".##.#.#.",
    "........",
    "#.##.#.#",
    "#.#..#..",
    "#.##...#",
    "#.##.#.#",
    "###...##"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 3715522238,
  "sourceCandidateId": "generated-monster-only-8-3715522238",
  "sourceArchetype": "monster-only",
  "difficulty": "medium",
  "difficultyScore": 35,
  "humanStatus": "solved-with-contradiction"
};

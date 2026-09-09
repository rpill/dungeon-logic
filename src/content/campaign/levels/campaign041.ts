import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-041",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    2,
    1,
    3,
    4,
    5,
    5
  ],
  "columnClues": [
    5,
    5,
    3,
    1,
    2,
    4,
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
      "x": 1,
      "y": 3
    },
    {
      "x": 2,
      "y": 5
    },
    {
      "x": 4,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "##...#.",
    ".#.#...",
    ".....#.",
    "#.#.#..",
    "###...#",
    "##..###",
    "###..##"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-monster-only-7-2434930474",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 62,
  "humanStatus": "solved-with-contradiction"
};

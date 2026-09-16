import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-032",
  "width": 8,
  "height": 8,
  "rowClues": [
    7,
    5,
    4,
    2,
    3,
    2,
    2,
    2
  ],
  "columnClues": [
    5,
    4,
    2,
    4,
    5,
    1,
    3,
    3
  ],
  "monsters": [
    {
      "x": 5,
      "y": 0
    },
    {
      "x": 7,
      "y": 1
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
      "x": 2,
      "y": 7
    },
    {
      "x": 7,
      "y": 7
    }
  ],
  "chests": [
    {
      "x": 3,
      "y": 2
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#####.##",
    "#####...",
    "#...#.##",
    "#...#...",
    "#...#.#.",
    ".#.#....",
    ".....#.#",
    ".#.#...."
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 673973298,
  "sourceCandidateId": "generated-mixed-one-room-8-673973298",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 60,
  "humanStatus": "solved-with-contradiction"
};

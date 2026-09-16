import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-008",
  "width": 8,
  "height": 8,
  "rowClues": [
    3,
    0,
    3,
    5,
    3,
    3,
    3,
    6
  ],
  "columnClues": [
    5,
    2,
    5,
    0,
    5,
    1,
    4,
    4
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 3,
      "y": 0
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
      "x": 3,
      "y": 7
    },
    {
      "x": 5,
      "y": 7
    }
  ],
  "chests": [
    {
      "x": 6,
      "y": 2
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    ".##.#...",
    "........",
    "#.#.#...",
    "#...####",
    "..#...##",
    "#.#.#...",
    "#.....##",
    "###.#.##"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 1555570831,
  "sourceCandidateId": "generated-mixed-one-room-8-1555570831",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "easy",
  "difficultyScore": 18,
  "humanStatus": "solved-direct"
};

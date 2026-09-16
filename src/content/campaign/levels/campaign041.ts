import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-041",
  "width": 8,
  "height": 8,
  "rowClues": [
    3,
    2,
    3,
    5,
    1,
    3,
    4,
    5
  ],
  "columnClues": [
    7,
    2,
    4,
    2,
    6,
    1,
    3,
    1
  ],
  "monsters": [
    {
      "x": 7,
      "y": 0
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
      "x": 1,
      "y": 6
    },
    {
      "x": 3,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 2,
      "y": 0
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#...##..",
    "#......#",
    "#...#.#.",
    "#####...",
    "......#.",
    "#.#.#...",
    "#.#.#.#.",
    "#####..."
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 1556409474,
  "sourceCandidateId": "generated-mixed-one-room-8-1556409474",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 64,
  "humanStatus": "solved-with-contradiction"
};

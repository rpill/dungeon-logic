import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-012",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    2,
    4,
    4,
    3,
    1,
    2
  ],
  "columnClues": [
    2,
    4,
    1,
    4,
    2,
    4,
    4
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 2,
      "y": 0
    },
    {
      "x": 4,
      "y": 2
    },
    {
      "x": 0,
      "y": 3
    },
    {
      "x": 3,
      "y": 3
    },
    {
      "x": 0,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 6,
      "y": 6
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    ".#.####",
    ".....##",
    ".#.#.##",
    ".#..###",
    "##.#...",
    "#......",
    "..##..."
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 1123580877,
  "sourceCandidateId": "generated-mixed-one-room-7-1123580877",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 30,
  "humanStatus": "solved-with-contradiction"
};

import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-053",
  "width": 8,
  "height": 8,
  "rowClues": [
    4,
    4,
    3,
    0,
    3,
    5,
    4,
    4
  ],
  "columnClues": [
    3,
    2,
    3,
    2,
    3,
    4,
    5,
    5
  ],
  "monsters": [
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 4,
      "y": 5
    },
    {
      "x": 0,
      "y": 6
    },
    {
      "x": 1,
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
    "...#.###",
    ".#...###",
    ".#.##...",
    "........",
    "#.#.#...",
    "#.#..###",
    "....####",
    "#.#...##"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 365614303,
  "sourceCandidateId": "generated-mixed-one-room-8-365614303",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 70,
  "humanStatus": "solved-with-contradiction"
};

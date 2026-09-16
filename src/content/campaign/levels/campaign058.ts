import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-058",
  "width": 8,
  "height": 8,
  "rowClues": [
    3,
    3,
    1,
    4,
    3,
    5,
    1,
    6
  ],
  "columnClues": [
    3,
    3,
    1,
    3,
    3,
    4,
    4,
    5
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 6,
      "y": 6
    },
    {
      "x": 0,
      "y": 7
    },
    {
      "x": 2,
      "y": 7
    }
  ],
  "chests": [
    {
      "x": 6,
      "y": 1
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    ".....###",
    "#.#.#...",
    "#.......",
    "##.##...",
    ".....###",
    ".#.#.###",
    ".......#",
    ".#.#####"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 1673161259,
  "sourceCandidateId": "generated-mixed-one-room-8-1673161259",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 71,
  "humanStatus": "solved-with-contradiction"
};

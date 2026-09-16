import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-020",
  "width": 6,
  "height": 6,
  "rowClues": [
    4,
    4,
    2,
    0,
    2,
    4
  ],
  "columnClues": [
    2,
    1,
    4,
    3,
    3,
    3
  ],
  "monsters": [
    {
      "x": 2,
      "y": 0
    },
    {
      "x": 0,
      "y": 1
    },
    {
      "x": 1,
      "y": 5
    }
  ],
  "chests": [
    {
      "x": 5,
      "y": 3
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#..###",
    "..####",
    "#.#...",
    "......",
    ".##...",
    "..####"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 1118198717,
  "sourceCandidateId": "generated-mixed-one-room-6-1118198717",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 40,
  "humanStatus": "solved-with-contradiction"
};

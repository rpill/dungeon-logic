import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-019",
  "width": 6,
  "height": 6,
  "rowClues": [
    4,
    5,
    2,
    0,
    2,
    3
  ],
  "columnClues": [
    3,
    1,
    3,
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
      "x": 2,
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
    "#.####",
    "#.#...",
    "......",
    ".##...",
    "...###"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 3638059437,
  "sourceCandidateId": "generated-mixed-one-room-6-3638059437",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 40,
  "humanStatus": "solved-with-contradiction"
};

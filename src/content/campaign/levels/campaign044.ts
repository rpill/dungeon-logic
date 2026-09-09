import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-044",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    6,
    3,
    1,
    3,
    3,
    1
  ],
  "columnClues": [
    5,
    3,
    3,
    2,
    3,
    3,
    1
  ],
  "monsters": [
    {
      "x": 3,
      "y": 0
    },
    {
      "x": 0,
      "y": 5
    },
    {
      "x": 6,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 1,
      "y": 3
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "###....",
    "######.",
    "#...##.",
    "#......",
    "#...#.#",
    ".###...",
    ".....#."
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-mixed-one-room-7-4119298720",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 64,
  "humanStatus": "solved-with-contradiction"
};

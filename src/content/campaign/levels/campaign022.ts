import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-022",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    3,
    1,
    4,
    3,
    2,
    4
  ],
  "columnClues": [
    1,
    2,
    2,
    4,
    1,
    5,
    4
  ],
  "monsters": [],
  "chests": [
    {
      "x": 0,
      "y": 5
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    ".....##",
    ".###...",
    ".....#.",
    "####...",
    "...#.##",
    ".....##",
    "...####"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-chest-one-room-7-1650520951",
  "sourceArchetype": "chest-one-room",
  "difficulty": "hard",
  "difficultyScore": 62,
  "humanStatus": "solved-with-contradiction"
};

import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-015",
  "width": 7,
  "height": 7,
  "rowClues": [
    1,
    4,
    2,
    1,
    2,
    4,
    1
  ],
  "columnClues": [
    2,
    3,
    2,
    2,
    2,
    4,
    0
  ],
  "monsters": [],
  "chests": [
    {
      "x": 3,
      "y": 2
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#......",
    "..####.",
    ".#...#.",
    ".#.....",
    ".#...#.",
    "..####.",
    "#......"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-chest-one-room-7-3249734737",
  "sourceArchetype": "chest-one-room",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction"
};

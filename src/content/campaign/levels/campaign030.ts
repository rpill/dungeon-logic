import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-030",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    5,
    3,
    4,
    1,
    2,
    4
  ],
  "columnClues": [
    4,
    3,
    3,
    3,
    1,
    4,
    4
  ],
  "monsters": [],
  "chests": [
    {
      "x": 6,
      "y": 4
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#....##",
    "#.##.##",
    "..#..##",
    ".#..###",
    "...#...",
    "##.....",
    "####..."
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-chest-one-room-7-519962590",
  "sourceArchetype": "chest-one-room",
  "difficulty": "hard",
  "difficultyScore": 69,
  "humanStatus": "solved-with-contradiction"
};

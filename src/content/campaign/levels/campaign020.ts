import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-020",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    3,
    1,
    4,
    1,
    2,
    4
  ],
  "columnClues": [
    4,
    4,
    3,
    2,
    2,
    2,
    1
  ],
  "monsters": [],
  "chests": [
    {
      "x": 6,
      "y": 6
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "###....",
    "#...##.",
    "..#....",
    ".#..###",
    "...#...",
    "##.....",
    "####..."
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-chest-one-room-7-2763683218",
  "sourceArchetype": "chest-one-room",
  "difficulty": "hard",
  "difficultyScore": 60,
  "humanStatus": "solved-with-contradiction"
};

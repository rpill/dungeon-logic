import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-039",
  "width": 8,
  "height": 8,
  "rowClues": [
    5,
    1,
    3,
    2,
    5,
    4,
    2,
    5
  ],
  "columnClues": [
    5,
    6,
    1,
    3,
    1,
    4,
    5,
    2
  ],
  "monsters": [],
  "chests": [
    {
      "x": 3,
      "y": 7
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "##...###",
    "...#....",
    ".#...##.",
    "...#..#.",
    "#####...",
    "##...##.",
    "##......",
    "##...###"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 3240214236,
  "sourceCandidateId": "generated-chest-one-room-8-3240214236",
  "sourceArchetype": "chest-one-room",
  "difficulty": "hard",
  "difficultyScore": 65,
  "humanStatus": "solved-with-contradiction"
};

import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-063",
  "width": 8,
  "height": 8,
  "rowClues": [
    3,
    4,
    2,
    2,
    4,
    7,
    2,
    7
  ],
  "columnClues": [
    5,
    5,
    3,
    4,
    2,
    3,
    5,
    4
  ],
  "monsters": [
    {
      "x": 2,
      "y": 0
    },
    {
      "x": 2,
      "y": 6
    },
    {
      "x": 7,
      "y": 6
    },
    {
      "x": 4,
      "y": 7
    }
  ],
  "chests": [
    {
      "x": 0,
      "y": 4
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "##..#...",
    "###...#.",
    "...##...",
    "......##",
    "...#.###",
    "####.###",
    "##......",
    "####.###"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 1106065937,
  "sourceCandidateId": "generated-mixed-one-room-8-1106065937",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 72,
  "humanStatus": "solved-with-contradiction"
};

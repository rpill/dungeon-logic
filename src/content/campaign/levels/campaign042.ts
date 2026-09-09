import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-042",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    1,
    4,
    2,
    1,
    3,
    5
  ],
  "columnClues": [
    1,
    2,
    3,
    3,
    2,
    6,
    3
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
      "y": 4
    },
    {
      "x": 1,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 4,
      "y": 4
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "..##.##",
    "#......",
    "..####.",
    ".#...#.",
    ".....#.",
    ".#...##",
    "..#####"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-mixed-one-room-7-2508481628",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 58,
  "humanStatus": "solved-with-contradiction"
};

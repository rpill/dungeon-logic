import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-017",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    2,
    1,
    3,
    3,
    5,
    4
  ],
  "columnClues": [
    4,
    3,
    1,
    3,
    3,
    4,
    4
  ],
  "monsters": [
    {
      "x": 3,
      "y": 0
    },
    {
      "x": 0,
      "y": 1
    },
    {
      "x": 3,
      "y": 4
    },
    {
      "x": 0,
      "y": 5
    },
    {
      "x": 4,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 6,
      "y": 1
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#...###",
    "..##...",
    "#......",
    "##.#...",
    "....###",
    ".#.####",
    "##...##"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-mixed-one-room-7-1411362502",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 43,
  "humanStatus": "solved-with-contradiction"
};

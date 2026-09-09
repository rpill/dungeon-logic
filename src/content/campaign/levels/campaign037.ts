import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-037",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    3,
    2,
    0,
    3,
    6,
    5
  ],
  "columnClues": [
    2,
    2,
    4,
    4,
    3,
    3,
    3
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 0,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 5,
      "y": 4
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    ".##....",
    "....###",
    ".#.#...",
    ".......",
    "#.##...",
    "#.#####",
    "..#####"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-mixed-one-room-7-399276142",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 64,
  "humanStatus": "solved-with-contradiction"
};

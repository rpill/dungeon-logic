import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-005",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    4,
    3,
    5,
    0,
    3,
    2
  ],
  "columnClues": [
    4,
    2,
    0,
    2,
    4,
    4,
    5
  ],
  "monsters": [
    {
      "x": 5,
      "y": 2
    },
    {
      "x": 6,
      "y": 5
    }
  ],
  "chests": [
    {
      "x": 1,
      "y": 0
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#...###",
    "#...###",
    "#...#.#",
    "##.##.#",
    ".......",
    ".#.#.#.",
    ".....##"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-mixed-one-room-7-1202807671",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "easy",
  "difficultyScore": 14,
  "humanStatus": "solved-direct"
};

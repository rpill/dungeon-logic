import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-010",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    4,
    3,
    2,
    3,
    4,
    0
  ],
  "columnClues": [
    5,
    3,
    2,
    3,
    4,
    2,
    2
  ],
  "monsters": [
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 0,
      "y": 5
    },
    {
      "x": 6,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 1,
      "y": 2
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "####.#.",
    "####...",
    "#...##.",
    "#...#..",
    "#...#.#",
    ".#.##.#",
    "......."
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-mixed-one-room-7-186736811",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 31,
  "humanStatus": "solved-with-contradiction"
};

import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-047",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    5,
    2,
    3,
    2,
    4,
    0
  ],
  "columnClues": [
    5,
    3,
    2,
    2,
    4,
    1,
    4
  ],
  "monsters": [
    {
      "x": 3,
      "y": 0
    },
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 6,
      "y": 4
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
      "x": 3,
      "y": 2
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "###..##",
    "####..#",
    "#...#..",
    "#...#.#",
    "#...#..",
    ".#.##.#",
    "......."
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-mixed-one-room-7-2840113963",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 56,
  "humanStatus": "solved-with-contradiction"
};

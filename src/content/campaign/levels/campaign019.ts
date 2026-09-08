import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-019",
  "width": 7,
  "height": 7,
  "rowClues": [
    6,
    3,
    1,
    4,
    3,
    1,
    3
  ],
  "columnClues": [
    5,
    2,
    3,
    2,
    3,
    2,
    4
  ],
  "monsters": [
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 1,
      "y": 1
    },
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 0,
      "y": 3
    },
    {
      "x": 4,
      "y": 3
    },
    {
      "x": 6,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 2,
      "y": 4
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "####.##",
    "#.#...#",
    "....#..",
    ".###..#",
    "#...#.#",
    "#......",
    "#...##."
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-mixed-one-room-7-4265337869",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 57,
  "humanStatus": "solved-with-contradiction"
};

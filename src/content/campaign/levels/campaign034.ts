import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-034",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    3,
    3,
    4,
    1,
    4,
    2
  ],
  "columnClues": [
    4,
    2,
    5,
    4,
    3,
    1,
    2
  ],
  "monsters": [
    {
      "x": 1,
      "y": 1
    },
    {
      "x": 3,
      "y": 3
    },
    {
      "x": 3,
      "y": 6
    },
    {
      "x": 6,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 5,
      "y": 0
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "####...",
    "#.##...",
    "#.##...",
    "#.#.#.#",
    "......#",
    ".####..",
    "....##."
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-mixed-one-room-7-712828176",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 61,
  "humanStatus": "solved-with-contradiction"
};

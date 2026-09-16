import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-028",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    3,
    2,
    0,
    2,
    4,
    6
  ],
  "columnClues": [
    4,
    4,
    3,
    4,
    1,
    3,
    2
  ],
  "monsters": [
    {
      "x": 2,
      "y": 0
    },
    {
      "x": 5,
      "y": 0
    },
    {
      "x": 4,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 0,
      "y": 3
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "##..#.#",
    "###....",
    "...#.#.",
    ".......",
    "...#.#.",
    "####...",
    "####.##"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 3029917163,
  "sourceCandidateId": "generated-mixed-one-room-7-3029917163",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 56,
  "humanStatus": "solved-with-contradiction"
};

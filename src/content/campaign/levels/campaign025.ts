import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-025",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    3,
    1,
    4,
    3,
    3,
    4
  ],
  "columnClues": [
    5,
    1,
    5,
    3,
    3,
    1,
    2
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
      "y": 2
    },
    {
      "x": 3,
      "y": 3
    },
    {
      "x": 1,
      "y": 5
    }
  ],
  "chests": [
    {
      "x": 6,
      "y": 5
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "....##.",
    "#.#.#..",
    "......#",
    "#.#.#.#",
    "#.##...",
    "#.##...",
    "####..."
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-mixed-one-room-7-1156550436",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 60,
  "humanStatus": "solved-with-contradiction"
};

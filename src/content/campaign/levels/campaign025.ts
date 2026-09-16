import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-025",
  "width": 6,
  "height": 6,
  "rowClues": [
    4,
    4,
    2,
    0,
    2,
    3
  ],
  "columnClues": [
    3,
    3,
    3,
    3,
    1,
    2
  ],
  "monsters": [
    {
      "x": 3,
      "y": 0
    },
    {
      "x": 5,
      "y": 1
    },
    {
      "x": 3,
      "y": 5
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
    "###..#",
    "####..",
    "...#.#",
    "......",
    "...##.",
    "###..."
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 3625485627,
  "sourceCandidateId": "generated-mixed-one-room-6-3625485627",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 54,
  "humanStatus": "solved-with-contradiction"
};

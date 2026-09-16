import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-017",
  "width": 8,
  "height": 8,
  "rowClues": [
    3,
    5,
    6,
    0,
    6,
    1,
    4,
    4
  ],
  "columnClues": [
    6,
    5,
    5,
    0,
    6,
    1,
    2,
    4
  ],
  "monsters": [
    {
      "x": 1,
      "y": 0
    },
    {
      "x": 6,
      "y": 1
    },
    {
      "x": 0,
      "y": 3
    },
    {
      "x": 7,
      "y": 3
    },
    {
      "x": 0,
      "y": 5
    },
    {
      "x": 3,
      "y": 7
    }
  ],
  "chests": [
    {
      "x": 7,
      "y": 7
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#.....##",
    "###.#..#",
    "###.#.##",
    "........",
    "###.##.#",
    "....#...",
    "###.#...",
    "###.#..."
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 3090538814,
  "sourceCandidateId": "generated-mixed-one-room-8-3090538814",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 34,
  "humanStatus": "solved-with-contradiction"
};

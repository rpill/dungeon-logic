import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-047",
  "width": 8,
  "height": 8,
  "rowClues": [
    6,
    1,
    2,
    1,
    5,
    1,
    4,
    6
  ],
  "columnClues": [
    4,
    3,
    3,
    3,
    3,
    3,
    5,
    2
  ],
  "monsters": [
    {
      "x": 5,
      "y": 0
    },
    {
      "x": 7,
      "y": 0
    },
    {
      "x": 0,
      "y": 5
    },
    {
      "x": 1,
      "y": 6
    },
    {
      "x": 2,
      "y": 7
    }
  ],
  "chests": [
    {
      "x": 1,
      "y": 1
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#####.#.",
    "...#....",
    ".....##.",
    "...#....",
    "###..##.",
    "....#...",
    "#.#...##",
    "##..####"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 1540614772,
  "sourceCandidateId": "generated-mixed-one-room-8-1540614772",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 69,
  "humanStatus": "solved-with-contradiction"
};

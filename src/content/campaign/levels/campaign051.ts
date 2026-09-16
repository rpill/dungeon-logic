import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-051",
  "width": 8,
  "height": 8,
  "rowClues": [
    3,
    6,
    4,
    2,
    3,
    4,
    1,
    3
  ],
  "columnClues": [
    5,
    4,
    2,
    3,
    5,
    1,
    4,
    2
  ],
  "monsters": [
    {
      "x": 3,
      "y": 0
    },
    {
      "x": 7,
      "y": 1
    },
    {
      "x": 0,
      "y": 5
    },
    {
      "x": 4,
      "y": 7
    },
    {
      "x": 6,
      "y": 7
    }
  ],
  "chests": [
    {
      "x": 3,
      "y": 3
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "###.....",
    "#####.#.",
    "#...#.##",
    "#...#...",
    "#...#.#.",
    ".#.##.#.",
    ".#......",
    "...#.#.#"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 1826735488,
  "sourceCandidateId": "generated-mixed-one-room-8-1826735488",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 69,
  "humanStatus": "solved-with-contradiction"
};

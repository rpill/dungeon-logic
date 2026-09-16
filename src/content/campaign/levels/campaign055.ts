import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-055",
  "width": 8,
  "height": 8,
  "rowClues": [
    1,
    3,
    2,
    3,
    2,
    4,
    6,
    7
  ],
  "columnClues": [
    4,
    4,
    2,
    3,
    4,
    2,
    4,
    5
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 7,
      "y": 2
    },
    {
      "x": 3,
      "y": 7
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
    "....#...",
    "#.#...#.",
    "....#.#.",
    ".#.#...#",
    "...#...#",
    "##.#...#",
    "##..####",
    "###.####"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 1006091771,
  "sourceCandidateId": "generated-mixed-one-room-8-1006091771",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 71,
  "humanStatus": "solved-with-contradiction"
};

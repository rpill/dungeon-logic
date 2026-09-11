import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-006",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    2,
    2,
    2,
    4,
    2,
    4
  ],
  "columnClues": [
    0,
    5,
    0,
    6,
    3,
    2,
    4
  ],
  "monsters": [],
  "chests": [
    {
      "x": 6,
      "y": 2
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "...####",
    ".#.#...",
    ".#.#...",
    ".#.#...",
    ".#.##.#",
    ".#....#",
    "...####"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 123456,
  "sourceCandidateId": "generated-chest-one-room-7-3193369624",
  "sourceArchetype": "chest-one-room",
  "difficulty": "easy",
  "difficultyScore": 10,
  "humanStatus": "solved-direct"
};

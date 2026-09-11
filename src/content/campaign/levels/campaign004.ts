import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-004",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    2,
    4,
    4,
    2,
    2,
    1
  ],
  "columnClues": [
    0,
    5,
    0,
    6,
    3,
    1,
    4
  ],
  "monsters": [],
  "chests": [
    {
      "x": 6,
      "y": 5
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "...####",
    ".#....#",
    ".#.##.#",
    ".#.##.#",
    ".#.#...",
    ".#.#...",
    "...#..."
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 2320,
  "sourceCandidateId": "generated-chest-one-room-7-2320",
  "sourceArchetype": "chest-one-room",
  "difficulty": "easy",
  "difficultyScore": 11,
  "humanStatus": "solved-direct"
};

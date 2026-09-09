import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-043",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    3,
    2,
    4,
    1,
    4,
    4
  ],
  "columnClues": [
    2,
    4,
    2,
    6,
    2,
    2,
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
    ".#...##",
    "...#..#",
    ".#.##.#",
    "...#...",
    "####...",
    "####..."
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-chest-one-room-7-4260164457",
  "sourceArchetype": "chest-one-room",
  "difficulty": "hard",
  "difficultyScore": 63,
  "humanStatus": "solved-with-contradiction"
};

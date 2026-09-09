import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-048",
  "width": 7,
  "height": 7,
  "rowClues": [
    1,
    2,
    2,
    4,
    0,
    5,
    1
  ],
  "columnClues": [
    2,
    3,
    1,
    5,
    2,
    1,
    1
  ],
  "monsters": [],
  "chests": [
    {
      "x": 5,
      "y": 0
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "...#...",
    ".#.#...",
    ".#.#...",
    ".#.##.#",
    ".......",
    "#.####.",
    "#......"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-chest-one-room-7-1915119007",
  "sourceArchetype": "chest-one-room",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction"
};

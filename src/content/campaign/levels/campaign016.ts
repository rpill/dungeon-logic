import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-016",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    3,
    4,
    2,
    2,
    2,
    1
  ],
  "columnClues": [
    3,
    2,
    2,
    3,
    3,
    1,
    4
  ],
  "monsters": [],
  "chests": [
    {
      "x": 6,
      "y": 6
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#...###",
    "#.#...#",
    "#.#.#.#",
    "....#.#",
    ".#.#...",
    ".#.#...",
    "...#..."
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-chest-one-room-7-3043298098",
  "sourceArchetype": "chest-one-room",
  "difficulty": "hard",
  "difficultyScore": 57,
  "humanStatus": "solved-with-contradiction"
};

import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-038",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    1,
    3,
    3,
    2,
    3,
    2
  ],
  "columnClues": [
    1,
    2,
    2,
    3,
    3,
    3,
    4
  ],
  "monsters": [],
  "chests": [
    {
      "x": 1,
      "y": 2
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "...####",
    "......#",
    "...##.#",
    "###....",
    "....##.",
    ".###...",
    ".....##"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-chest-one-room-7-3258216195",
  "sourceArchetype": "chest-one-room",
  "difficulty": "hard",
  "difficultyScore": 67,
  "humanStatus": "solved-with-contradiction"
};

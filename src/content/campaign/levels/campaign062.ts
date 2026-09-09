import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-062",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    3,
    1,
    3,
    4,
    1,
    3
  ],
  "columnClues": [
    4,
    1,
    4,
    4,
    3,
    1,
    3
  ],
  "monsters": [
    {
      "x": 2,
      "y": 0
    },
    {
      "x": 0,
      "y": 2
    },
    {
      "x": 2,
      "y": 2
    },
    {
      "x": 3,
      "y": 4
    },
    {
      "x": 0,
      "y": 6
    },
    {
      "x": 3,
      "y": 6
    },
    {
      "x": 6,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 6,
      "y": 1
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#..####",
    "#.##...",
    "...#...",
    "#.##...",
    "#.#.#.#",
    "......#",
    ".##.#.."
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-mixed-one-room-7-3149956388",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 41,
  "humanStatus": "solved-with-contradiction"
};

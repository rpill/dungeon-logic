import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-054",
  "width": 7,
  "height": 7,
  "rowClues": [
    6,
    2,
    1,
    2,
    4,
    5,
    2
  ],
  "columnClues": [
    4,
    3,
    3,
    5,
    2,
    3,
    2
  ],
  "monsters": [
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 6,
      "y": 3
    },
    {
      "x": 6,
      "y": 5
    },
    {
      "x": 1,
      "y": 6
    },
    {
      "x": 5,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 1,
      "y": 3
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "######.",
    "...##..",
    "......#",
    "...#.#.",
    "####...",
    "####.#.",
    "#.....#"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-mixed-one-room-7-3696713054",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 68,
  "humanStatus": "solved-with-contradiction"
};

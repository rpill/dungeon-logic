import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-052",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    3,
    3,
    3,
    1,
    2,
    4
  ],
  "columnClues": [
    5,
    4,
    2,
    4,
    2,
    2,
    2
  ],
  "monsters": [
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 1,
      "y": 2
    },
    {
      "x": 0,
      "y": 5
    },
    {
      "x": 1,
      "y": 6
    },
    {
      "x": 3,
      "y": 6
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
    "####.#.",
    "###....",
    "#...#.#",
    "##.#...",
    "...#...",
    ".#.#...",
    "#...###"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-mixed-one-room-7-3197931191",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 56,
  "humanStatus": "solved-with-contradiction"
};

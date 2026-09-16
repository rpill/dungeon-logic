import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-059",
  "width": 8,
  "height": 8,
  "rowClues": [
    5,
    3,
    3,
    5,
    0,
    4,
    5,
    5
  ],
  "columnClues": [
    3,
    6,
    4,
    3,
    3,
    3,
    6,
    2
  ],
  "monsters": [
    {
      "x": 5,
      "y": 1
    },
    {
      "x": 7,
      "y": 2
    },
    {
      "x": 0,
      "y": 5
    },
    {
      "x": 3,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "##...###",
    "...#..##",
    ".#...##.",
    ".###.##.",
    "........",
    ".##.#.#.",
    "###.#.#.",
    "#####..."
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 1561610273,
  "sourceCandidateId": "generated-monster-only-8-1561610273",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 71,
  "humanStatus": "solved-with-contradiction"
};

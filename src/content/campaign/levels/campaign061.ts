import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-061",
  "width": 8,
  "height": 8,
  "rowClues": [
    4,
    3,
    3,
    5,
    1,
    4,
    5,
    5
  ],
  "columnClues": [
    7,
    3,
    7,
    4,
    1,
    4,
    3,
    1
  ],
  "monsters": [
    {
      "x": 7,
      "y": 0
    },
    {
      "x": 1,
      "y": 2
    },
    {
      "x": 0,
      "y": 4
    },
    {
      "x": 1,
      "y": 6
    },
    {
      "x": 4,
      "y": 7
    },
    {
      "x": 6,
      "y": 7
    }
  ],
  "chests": [
    {
      "x": 4,
      "y": 2
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "###...#.",
    "###.....",
    "#.#...#.",
    "#.####..",
    ".......#",
    "#.##.#..",
    "#.##.##.",
    "####.#.."
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 3982097380,
  "sourceCandidateId": "generated-mixed-one-room-8-3982097380",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 72,
  "humanStatus": "solved-with-contradiction"
};

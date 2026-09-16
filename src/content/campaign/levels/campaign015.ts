import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-015",
  "width": 8,
  "height": 8,
  "rowClues": [
    3,
    0,
    3,
    3,
    5,
    1,
    6,
    7
  ],
  "columnClues": [
    4,
    4,
    3,
    5,
    0,
    5,
    3,
    4
  ],
  "monsters": [
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 7,
      "y": 0
    },
    {
      "x": 3,
      "y": 3
    },
    {
      "x": 2,
      "y": 4
    },
    {
      "x": 0,
      "y": 5
    },
    {
      "x": 6,
      "y": 6
    },
    {
      "x": 4,
      "y": 7
    }
  ],
  "chests": [
    {
      "x": 1,
      "y": 2
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "...#.##.",
    "........",
    "...#.##.",
    "###.....",
    "##.#.#.#",
    ".......#",
    "####.#.#",
    "####.###"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 3904956219,
  "sourceCandidateId": "generated-mixed-one-room-8-3904956219",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 34,
  "humanStatus": "solved-with-contradiction"
};

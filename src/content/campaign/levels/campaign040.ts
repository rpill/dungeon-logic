import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-040",
  "width": 8,
  "height": 8,
  "rowClues": [
    5,
    5,
    4,
    4,
    1,
    4,
    3,
    3
  ],
  "columnClues": [
    5,
    4,
    4,
    5,
    4,
    2,
    1,
    4
  ],
  "monsters": [
    {
      "x": 2,
      "y": 2
    },
    {
      "x": 0,
      "y": 3
    },
    {
      "x": 4,
      "y": 3
    },
    {
      "x": 7,
      "y": 5
    },
    {
      "x": 0,
      "y": 7
    },
    {
      "x": 5,
      "y": 7
    }
  ],
  "chests": [
    {
      "x": 5,
      "y": 0
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#####...",
    "#####...",
    "##.##...",
    ".#.#.#.#",
    ".......#",
    "#.##.#..",
    "#.#....#",
    "....#.##"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 3323006358,
  "sourceCandidateId": "generated-mixed-one-room-8-3323006358",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 66,
  "humanStatus": "solved-with-contradiction"
};

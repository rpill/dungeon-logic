import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-044",
  "width": 8,
  "height": 8,
  "rowClues": [
    5,
    3,
    3,
    3,
    4,
    1,
    5,
    2
  ],
  "columnClues": [
    7,
    5,
    3,
    2,
    4,
    2,
    1,
    2
  ],
  "monsters": [
    {
      "x": 2,
      "y": 1
    },
    {
      "x": 1,
      "y": 2
    },
    {
      "x": 7,
      "y": 4
    },
    {
      "x": 0,
      "y": 5
    },
    {
      "x": 7,
      "y": 6
    },
    {
      "x": 2,
      "y": 7
    }
  ],
  "chests": [
    {
      "x": 7,
      "y": 1
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#####...",
    "##..#...",
    "#.#.#...",
    "#....#.#",
    "##.#.#..",
    ".......#",
    "###.#.#.",
    "##......"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 3548855408,
  "sourceCandidateId": "generated-mixed-one-room-8-3548855408",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 67,
  "humanStatus": "solved-with-contradiction"
};

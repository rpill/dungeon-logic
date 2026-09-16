import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-016",
  "width": 8,
  "height": 8,
  "rowClues": [
    4,
    2,
    2,
    3,
    2,
    3,
    4,
    7
  ],
  "columnClues": [
    3,
    3,
    2,
    4,
    4,
    2,
    4,
    5
  ],
  "monsters": [
    {
      "x": 1,
      "y": 0
    },
    {
      "x": 3,
      "y": 0
    },
    {
      "x": 5,
      "y": 0
    },
    {
      "x": 7,
      "y": 0
    },
    {
      "x": 7,
      "y": 2
    },
    {
      "x": 3,
      "y": 6
    },
    {
      "x": 2,
      "y": 7
    }
  ],
  "chests": [
    {
      "x": 6,
      "y": 4
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#.#.#.#.",
    "#.#.....",
    "....#.#.",
    ".#.#...#",
    "...#...#",
    ".#.#...#",
    "....####",
    "##.#####"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 1250217940,
  "sourceCandidateId": "generated-mixed-one-room-8-1250217940",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 35,
  "humanStatus": "solved-with-contradiction"
};

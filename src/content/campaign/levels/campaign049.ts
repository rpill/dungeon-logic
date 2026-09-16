import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-049",
  "width": 8,
  "height": 8,
  "rowClues": [
    4,
    2,
    5,
    2,
    5,
    1,
    3,
    5
  ],
  "columnClues": [
    6,
    4,
    3,
    4,
    4,
    3,
    0,
    3
  ],
  "monsters": [
    {
      "x": 2,
      "y": 0
    },
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 7,
      "y": 0
    },
    {
      "x": 1,
      "y": 1
    },
    {
      "x": 7,
      "y": 2
    },
    {
      "x": 0,
      "y": 6
    },
    {
      "x": 2,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 6,
      "y": 7
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "##.#.#..",
    "#......#",
    "####.#..",
    "#......#",
    "#.#.##.#",
    "....#...",
    ".#.##...",
    "#####..."
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 1236115149,
  "sourceCandidateId": "generated-mixed-one-room-8-1236115149",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 68,
  "humanStatus": "solved-with-contradiction"
};

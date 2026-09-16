import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-037",
  "width": 8,
  "height": 8,
  "rowClues": [
    5,
    4,
    2,
    4,
    1,
    3,
    4,
    3
  ],
  "columnClues": [
    6,
    2,
    5,
    3,
    3,
    1,
    2,
    4
  ],
  "monsters": [
    {
      "x": 1,
      "y": 1
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
      "y": 3
    },
    {
      "x": 7,
      "y": 3
    },
    {
      "x": 0,
      "y": 4
    },
    {
      "x": 7,
      "y": 7
    }
  ],
  "chests": [
    {
      "x": 4,
      "y": 0
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "####...#",
    "#.##...#",
    "...#...#",
    "#.#.#.#.",
    "......#.",
    "#.#.#...",
    "#...##.#",
    "###....."
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 393752821,
  "sourceCandidateId": "generated-mixed-one-room-8-393752821",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 63,
  "humanStatus": "solved-with-contradiction"
};

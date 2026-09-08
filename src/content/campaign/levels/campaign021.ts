import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-021",
  "width": 7,
  "height": 7,
  "rowClues": [
    1,
    3,
    3,
    1,
    3,
    6,
    3
  ],
  "columnClues": [
    3,
    1,
    3,
    2,
    3,
    3,
    5
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 6,
      "y": 1
    },
    {
      "x": 0,
      "y": 3
    },
    {
      "x": 0,
      "y": 6
    },
    {
      "x": 3,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 5,
      "y": 2
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    ".#.....",
    "...###.",
    "#.#...#",
    "......#",
    "#.#...#",
    "#.#####",
    "....###"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-mixed-one-room-7-1928236537",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 59,
  "humanStatus": "solved-with-contradiction"
};

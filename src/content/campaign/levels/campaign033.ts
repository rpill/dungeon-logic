import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-033",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    3,
    1,
    3,
    4,
    1,
    5
  ],
  "columnClues": [
    5,
    3,
    2,
    3,
    3,
    2,
    3
  ],
  "monsters": [
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 0,
      "y": 4
    },
    {
      "x": 6,
      "y": 4
    },
    {
      "x": 2,
      "y": 6
    },
    {
      "x": 4,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 1,
      "y": 1
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "####...",
    "#...##.",
    "#......",
    "#...#.#",
    ".####..",
    "......#",
    "##.#.##"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 3611261671,
  "sourceCandidateId": "generated-mixed-one-room-7-3611261671",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 59,
  "humanStatus": "solved-with-contradiction"
};

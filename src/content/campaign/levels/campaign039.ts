import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-039",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    5,
    3,
    1,
    3,
    4,
    1
  ],
  "columnClues": [
    5,
    3,
    3,
    2,
    3,
    2,
    2
  ],
  "monsters": [
    {
      "x": 3,
      "y": 0
    },
    {
      "x": 4,
      "y": 1
    },
    {
      "x": 0,
      "y": 5
    },
    {
      "x": 6,
      "y": 5
    }
  ],
  "chests": [
    {
      "x": 2,
      "y": 2
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "###....",
    "####.#.",
    "#...##.",
    "#......",
    "#...#.#",
    ".####..",
    "......#"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-mixed-one-room-7-3082845912",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 59,
  "humanStatus": "solved-with-contradiction"
};

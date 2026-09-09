import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-049",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    2,
    2,
    4,
    1,
    5,
    4
  ],
  "columnClues": [
    4,
    6,
    1,
    3,
    3,
    2,
    2
  ],
  "monsters": [
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 0,
      "y": 2
    },
    {
      "x": 2,
      "y": 6
    },
    {
      "x": 6,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 3,
      "y": 2
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "##...#.",
    "##.....",
    ".#...#.",
    ".####..",
    "......#",
    "##.##.#",
    "##.##.."
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-mixed-one-room-7-3512357849",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 66,
  "humanStatus": "solved-with-contradiction"
};

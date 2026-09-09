import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-059",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    3,
    3,
    5,
    2,
    3,
    1
  ],
  "columnClues": [
    6,
    4,
    3,
    0,
    2,
    4,
    1
  ],
  "monsters": [
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 1,
      "y": 4
    },
    {
      "x": 0,
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
      "y": 0
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "##...#.",
    "##...#.",
    "##...#.",
    "###.##.",
    "#.#....",
    "#...#.#",
    "..#...."
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-mixed-one-room-7-2944001240",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction"
};

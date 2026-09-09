import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-064",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    5,
    3,
    2,
    2,
    4,
    2
  ],
  "columnClues": [
    5,
    3,
    3,
    3,
    3,
    1,
    5
  ],
  "monsters": [
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 4,
      "y": 1
    },
    {
      "x": 6,
      "y": 4
    },
    {
      "x": 0,
      "y": 5
    }
  ],
  "chests": [
    {
      "x": 1,
      "y": 4
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#####..",
    "####..#",
    "#...#.#",
    "#.....#",
    "#...#..",
    ".###..#",
    ".....##"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-mixed-one-room-7-3572693294",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 45,
  "humanStatus": "solved-with-contradiction"
};

import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-013",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    2,
    3,
    3,
    3,
    3,
    5
  ],
  "columnClues": [
    4,
    1,
    3,
    3,
    1,
    3,
    6
  ],
  "monsters": [
    {
      "x": 6,
      "y": 1
    },
    {
      "x": 2,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 5,
      "y": 5
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    ".....##",
    ".#.#...",
    "...#.##",
    "#.#...#",
    "#.#...#",
    "#.#...#",
    "#..####"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 923682118,
  "sourceCandidateId": "generated-mixed-one-room-7-923682118",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 31,
  "humanStatus": "solved-with-contradiction"
};

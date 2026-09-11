import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-003",
  "width": 6,
  "height": 6,
  "rowClues": [
    1,
    2,
    4,
    3,
    3,
    3
  ],
  "columnClues": [
    5,
    4,
    2,
    0,
    2,
    3
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 5,
      "y": 0
    },
    {
      "x": 1,
      "y": 1
    },
    {
      "x": 5,
      "y": 2
    }
  ],
  "chests": [
    {
      "x": 4,
      "y": 4
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "....#.",
    "#.#...",
    "###.#.",
    "##...#",
    "##...#",
    "##...#"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 1337,
  "sourceCandidateId": "generated-mixed-one-room-6-3782245294",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "easy",
  "difficultyScore": 6,
  "humanStatus": "solved-direct"
};

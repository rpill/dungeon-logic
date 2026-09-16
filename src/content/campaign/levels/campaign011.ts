import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-011",
  "width": 6,
  "height": 6,
  "rowClues": [
    2,
    1,
    3,
    3,
    3,
    3
  ],
  "columnClues": [
    3,
    5,
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
      "x": 0,
      "y": 2
    },
    {
      "x": 5,
      "y": 2
    }
  ],
  "chests": [
    {
      "x": 3,
      "y": 5
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    ".##...",
    "....#.",
    ".##.#.",
    "##...#",
    "##...#",
    "##...#"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 3252734473,
  "sourceCandidateId": "generated-mixed-one-room-6-3252734473",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 29,
  "humanStatus": "solved-with-contradiction"
};

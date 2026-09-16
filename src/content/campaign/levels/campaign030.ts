import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-030",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    3,
    3,
    2,
    4,
    1,
    3
  ],
  "columnClues": [
    5,
    3,
    1,
    3,
    4,
    3,
    1
  ],
  "monsters": [
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 5,
      "y": 3
    },
    {
      "x": 4,
      "y": 4
    },
    {
      "x": 0,
      "y": 5
    },
    {
      "x": 5,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 2,
      "y": 1
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "####...",
    "#...##.",
    "#...##.",
    "#...#..",
    "##.#.#.",
    ".#.....",
    "...##.#"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 465622688,
  "sourceCandidateId": "generated-mixed-one-room-7-465622688",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 58,
  "humanStatus": "solved-with-contradiction"
};

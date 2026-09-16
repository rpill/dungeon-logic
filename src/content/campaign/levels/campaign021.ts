import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-021",
  "width": 6,
  "height": 6,
  "rowClues": [
    4,
    2,
    2,
    2,
    3,
    1
  ],
  "columnClues": [
    5,
    2,
    1,
    2,
    3,
    1
  ],
  "monsters": [
    {
      "x": 4,
      "y": 0
    },
    {
      "x": 0,
      "y": 5
    }
  ],
  "chests": [
    {
      "x": 1,
      "y": 2
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "####..",
    "#...#.",
    "#...#.",
    "#...#.",
    "##.#..",
    ".....#"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 170109249,
  "sourceCandidateId": "generated-mixed-one-room-6-170109249",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 41,
  "humanStatus": "solved-with-contradiction"
};

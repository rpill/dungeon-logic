import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-013",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    5,
    3,
    3,
    2,
    0,
    3
  ],
  "columnClues": [
    4,
    1,
    2,
    2,
    4,
    3,
    4
  ],
  "monsters": [
    {
      "x": 5,
      "y": 2
    },
    {
      "x": 5,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 0,
      "y": 5
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#...###",
    "#.#.###",
    "#...#.#",
    "###....",
    "...#.#.",
    ".......",
    "...##.#"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-mixed-one-room-7-1720831423",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 45,
  "humanStatus": "solved-with-contradiction"
};

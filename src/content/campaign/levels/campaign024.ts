import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-024",
  "width": 7,
  "height": 7,
  "rowClues": [
    1,
    1,
    2,
    3,
    3,
    3,
    4
  ],
  "columnClues": [
    4,
    1,
    2,
    2,
    2,
    3,
    3
  ],
  "monsters": [],
  "chests": [
    {
      "x": 1,
      "y": 0
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "...#...",
    ".....#.",
    "...#.#.",
    "###....",
    "#...#.#",
    "#.#...#",
    "#...###"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-chest-one-room-7-1414354357",
  "sourceArchetype": "chest-one-room",
  "difficulty": "hard",
  "difficultyScore": 60,
  "humanStatus": "solved-with-contradiction"
};

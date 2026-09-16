import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-043",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    3,
    3,
    4,
    2,
    1,
    4
  ],
  "columnClues": [
    4,
    1,
    3,
    4,
    2,
    5,
    1
  ],
  "monsters": [],
  "chests": [
    {
      "x": 1,
      "y": 6
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "###....",
    "#...##.",
    "#.#..#.",
    "#.##.#.",
    "...#.#.",
    "...#...",
    "...####"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 2353903757,
  "sourceCandidateId": "generated-chest-one-room-7-2353903757",
  "sourceArchetype": "chest-one-room",
  "difficulty": "hard",
  "difficultyScore": 66,
  "humanStatus": "solved-with-contradiction"
};

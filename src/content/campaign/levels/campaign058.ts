import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-058",
  "width": 7,
  "height": 7,
  "rowClues": [
    1,
    1,
    2,
    3,
    3,
    4,
    3
  ],
  "columnClues": [
    3,
    3,
    1,
    3,
    2,
    1,
    4
  ],
  "monsters": [],
  "chests": [
    {
      "x": 5,
      "y": 0
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "...#...",
    ".#.....",
    ".#.#...",
    "....###",
    "#.#...#",
    "#..##.#",
    "##....#"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-chest-one-room-7-1996532405",
  "sourceArchetype": "chest-one-room",
  "difficulty": "medium",
  "difficultyScore": 33,
  "humanStatus": "solved-with-contradiction"
};

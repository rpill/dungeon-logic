import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-018",
  "width": 7,
  "height": 7,
  "rowClues": [
    1,
    2,
    2,
    3,
    3,
    3,
    4
  ],
  "columnClues": [
    4,
    2,
    1,
    4,
    1,
    5,
    1
  ],
  "monsters": [],
  "chests": [
    {
      "x": 0,
      "y": 0
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "...#...",
    "...#.#.",
    "...#.#.",
    "#.#..#.",
    "#...##.",
    "##.#...",
    "##...##"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-chest-one-room-7-3380548303",
  "sourceArchetype": "chest-one-room",
  "difficulty": "hard",
  "difficultyScore": 58,
  "humanStatus": "solved-with-contradiction"
};

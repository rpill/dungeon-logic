import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-027",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    2,
    3,
    5,
    3,
    3,
    2
  ],
  "columnClues": [
    4,
    5,
    1,
    3,
    2,
    3,
    4
  ],
  "monsters": [],
  "chests": [
    {
      "x": 3,
      "y": 0
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "##...##",
    "##.....",
    "##...#.",
    "#####..",
    "...##.#",
    ".#.#..#",
    ".....##"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-chest-one-room-7-1989983689",
  "sourceArchetype": "chest-one-room",
  "difficulty": "hard",
  "difficultyScore": 64,
  "humanStatus": "solved-with-contradiction"
};

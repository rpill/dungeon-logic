import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-035",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    4,
    1,
    5,
    3,
    2,
    4
  ],
  "columnClues": [
    4,
    5,
    1,
    2,
    1,
    4,
    4
  ],
  "monsters": [],
  "chests": [
    {
      "x": 2,
      "y": 5
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    ".....##",
    ".#.#.##",
    "......#",
    "#####..",
    "##...#.",
    "##.....",
    "##...##"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 4231025609,
  "sourceCandidateId": "generated-chest-one-room-7-4231025609",
  "sourceArchetype": "chest-one-room",
  "difficulty": "hard",
  "difficultyScore": 61,
  "humanStatus": "solved-with-contradiction"
};

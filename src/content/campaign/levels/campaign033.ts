import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-033",
  "width": 7,
  "height": 7,
  "rowClues": [
    1,
    2,
    2,
    4,
    2,
    4,
    4
  ],
  "columnClues": [
    4,
    2,
    3,
    4,
    1,
    4,
    1
  ],
  "monsters": [],
  "chests": [
    {
      "x": 2,
      "y": 0
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "...#...",
    "...#.#.",
    "...#.#.",
    "#.##.#.",
    "#....#.",
    "###.#..",
    "###...#"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-chest-one-room-7-925120860",
  "sourceArchetype": "chest-one-room",
  "difficulty": "hard",
  "difficultyScore": 64,
  "humanStatus": "solved-with-contradiction"
};

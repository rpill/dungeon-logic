import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-060",
  "width": 8,
  "height": 8,
  "rowClues": [
    2,
    3,
    1,
    5,
    2,
    5,
    4,
    5
  ],
  "columnClues": [
    5,
    1,
    3,
    1,
    7,
    2,
    3,
    5
  ],
  "monsters": [],
  "chests": [
    {
      "x": 7,
      "y": 0
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#...#...",
    "#.#.#...",
    "....#...",
    ".#.###.#",
    "....#..#",
    "#.#.#.##",
    "#.#...##",
    "#...####"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 2031237330,
  "sourceCandidateId": "generated-chest-one-room-8-2031237330",
  "sourceArchetype": "chest-one-room",
  "difficulty": "hard",
  "difficultyScore": 72,
  "humanStatus": "solved-with-contradiction"
};

import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-045",
  "width": 8,
  "height": 8,
  "rowClues": [
    5,
    3,
    5,
    3,
    2,
    3,
    4,
    1
  ],
  "columnClues": [
    0,
    6,
    2,
    2,
    3,
    5,
    3,
    5
  ],
  "monsters": [],
  "chests": [
    {
      "x": 4,
      "y": 4
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "...#####",
    ".#....##",
    ".####..#",
    ".#...#.#",
    ".#...#..",
    ".#...##.",
    ".##.##..",
    ".......#"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 143552617,
  "sourceCandidateId": "generated-chest-one-room-8-143552617",
  "sourceArchetype": "chest-one-room",
  "difficulty": "hard",
  "difficultyScore": 67,
  "humanStatus": "solved-with-contradiction"
};

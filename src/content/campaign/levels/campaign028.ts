import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-028",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    3,
    3,
    3,
    4,
    1,
    2
  ],
  "columnClues": [
    4,
    3,
    1,
    3,
    5,
    1,
    4
  ],
  "monsters": [
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 0,
      "y": 4
    },
    {
      "x": 4,
      "y": 6
    },
    {
      "x": 6,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 3,
      "y": 2
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#####..",
    "#...#.#",
    "#...#.#",
    "#...#.#",
    ".#.##.#",
    ".#.....",
    "...#.#."
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-mixed-one-room-7-3716676536",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 62,
  "humanStatus": "solved-with-contradiction"
};

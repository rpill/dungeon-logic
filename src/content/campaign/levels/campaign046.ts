import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-046",
  "width": 8,
  "height": 8,
  "rowClues": [
    5,
    4,
    4,
    4,
    4,
    3,
    3,
    3
  ],
  "columnClues": [
    7,
    5,
    3,
    4,
    3,
    0,
    3,
    5
  ],
  "monsters": [
    {
      "x": 2,
      "y": 1
    },
    {
      "x": 1,
      "y": 3
    },
    {
      "x": 0,
      "y": 7
    },
    {
      "x": 3,
      "y": 7
    }
  ],
  "chests": [
    {
      "x": 6,
      "y": 1
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "####...#",
    "##.#...#",
    "##.#...#",
    "#...#.##",
    "###.#...",
    "##....#.",
    "#..##...",
    "..#...##"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 3584601694,
  "sourceCandidateId": "generated-mixed-one-room-8-3584601694",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 68,
  "humanStatus": "solved-with-contradiction"
};

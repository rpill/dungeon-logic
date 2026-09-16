import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-057",
  "width": 8,
  "height": 8,
  "rowClues": [
    1,
    3,
    4,
    4,
    4,
    1,
    4,
    5
  ],
  "columnClues": [
    4,
    1,
    2,
    4,
    2,
    2,
    6,
    5
  ],
  "monsters": [
    {
      "x": 7,
      "y": 1
    },
    {
      "x": 0,
      "y": 5
    },
    {
      "x": 7,
      "y": 5
    },
    {
      "x": 2,
      "y": 7
    },
    {
      "x": 4,
      "y": 7
    }
  ],
  "chests": [
    {
      "x": 1,
      "y": 0
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "...#....",
    "...#.##.",
    "...#.###",
    "#.#...##",
    "#...#.##",
    "..#.....",
    "#...#.##",
    "##.#..##"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 1158869852,
  "sourceCandidateId": "generated-mixed-one-room-8-1158869852",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 70,
  "humanStatus": "solved-with-contradiction"
};

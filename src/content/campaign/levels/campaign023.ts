import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-023",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    4,
    2,
    0,
    3,
    4,
    2
  ],
  "columnClues": [
    2,
    2,
    2,
    4,
    3,
    3,
    4
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 2,
      "y": 0
    },
    {
      "x": 0,
      "y": 6
    },
    {
      "x": 5,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 5,
      "y": 4
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    ".#.####",
    "...####",
    ".#.#...",
    ".......",
    "#.##...",
    "#...###",
    "..#...#"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 3550575386,
  "sourceCandidateId": "generated-mixed-one-room-7-3550575386",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 45,
  "humanStatus": "solved-with-contradiction"
};

import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-036",
  "width": 8,
  "height": 8,
  "rowClues": [
    4,
    2,
    3,
    5,
    1,
    3,
    3,
    5
  ],
  "columnClues": [
    6,
    4,
    2,
    3,
    2,
    3,
    1,
    5
  ],
  "monsters": [
    {
      "x": 5,
      "y": 0
    },
    {
      "x": 7,
      "y": 2
    },
    {
      "x": 7,
      "y": 4
    },
    {
      "x": 0,
      "y": 5
    },
    {
      "x": 7,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 1,
      "y": 1
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#...#.##",
    "#......#",
    "#...##..",
    "####...#",
    ".....#..",
    ".#.#...#",
    "##...#..",
    "####...#"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 2879312486,
  "sourceCandidateId": "generated-mixed-one-room-8-2879312486",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 62,
  "humanStatus": "solved-with-contradiction"
};

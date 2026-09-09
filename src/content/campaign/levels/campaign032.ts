import type { CampaignLevelProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "campaign-032",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    2,
    4,
    3,
    1,
    2,
    4
  ],
  "columnClues": [
    4,
    3,
    3,
    4,
    1,
    2,
    3
  ],
  "monsters": [
    {
      "x": 1,
      "y": 1
    },
    {
      "x": 6,
      "y": 5
    },
    {
      "x": 3,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 0,
      "y": 5
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "####...",
    "#....#.",
    "####...",
    "...#.##",
    "......#",
    "...##..",
    "###...#"
  ]
};

export const provenance: CampaignLevelProvenance = {
  "sourceSeed": 20260908,
  "sourceCandidateId": "generated-mixed-one-room-7-299745381",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 59,
  "humanStatus": "solved-with-contradiction"
};

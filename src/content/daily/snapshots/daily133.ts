import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-133",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    4,
    1,
    5,
    1,
    6,
    4
  ],
  "columnClues": [
    5,
    5,
    4,
    1,
    2,
    5,
    4
  ],
  "monsters": [
    {
      "x": 3,
      "y": 0
    },
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 0,
      "y": 3
    },
    {
      "x": 1,
      "y": 4
    },
    {
      "x": 6,
      "y": 4
    },
    {
      "x": 2,
      "y": 6
    },
    {
      "x": 4,
      "y": 6
    }
  ],
  "chests": [],
  "blockers": [],
  "doors": [],
  "solution": [
    "###..##",
    "####...",
    ".....#.",
    ".##.###",
    "#......",
    "###.###",
    "##...##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 193242539,
  "sourceCandidateId": "generated-monster-only-7-193242539",
  "sourceArchetype": "monster-only",
  "difficulty": "hard",
  "difficultyScore": 59,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 60
};

import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-059",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    5,
    4,
    4,
    2,
    1,
    2
  ],
  "columnClues": [
    4,
    3,
    1,
    4,
    3,
    4,
    4
  ],
  "monsters": [
    {
      "x": 3,
      "y": 0
    },
    {
      "x": 1,
      "y": 1
    },
    {
      "x": 4,
      "y": 2
    },
    {
      "x": 0,
      "y": 4
    },
    {
      "x": 0,
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
    "##..###",
    "#..####",
    "##...##",
    "...####",
    ".#.#...",
    "#......",
    "..##..."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 4127462827,
  "sourceCandidateId": "generated-mixed-one-room-7-4127462827",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 67,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 65
};
